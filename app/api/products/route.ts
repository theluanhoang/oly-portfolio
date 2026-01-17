import { prisma } from '@/lib/prisma';
import { Prisma } from '../../generated/prisma/client';

export async function GET(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const pageParam = searchParams.get('page');
    const pageSizeParam = searchParams.get('pageSize');
    const search = searchParams.get('q')?.trim() || '';
    const categoryFilter = searchParams.get('category')?.trim() || '';
    const yearFilter = searchParams.get('year')?.trim() || '';
    const searchValue = search.toLowerCase();

    const page = Math.max(Number(pageParam) || 1, 1);
    const pageSize = Math.min(Math.max(Number(pageSizeParam) || 12, 1), 100);
    const sortField = searchParams.get('sortField')?.trim() || 'createdAt';
    const sortDirection = searchParams.get('sortDirection')?.trim() || 'desc';

    const andConditions: Prisma.ProductWhereInput[] = [];

    if (searchValue.length > 0) {
      andConditions.push({
        OR: [
          {
            slug: {
              contains: searchValue,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            category: {
              translations: {
                some: {
                  name: {
                    contains: searchValue,
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
              },
            },
          },
          {
            material: {
              translations: {
                some: {
                  name: {
                    contains: searchValue,
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
              },
            },
          },
          {
            year: {
              contains: searchValue,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            translations: {
              some: {
                title: {
                  contains: searchValue,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
            },
          },
        ],
      });
    }

    if (categoryFilter.length > 0) {
      andConditions.push({
        category: {
          translations: {
            some: {
              name: {
                contains: categoryFilter,
                mode: Prisma.QueryMode.insensitive,
              },
            },
          },
        },
      });
    }

    if (yearFilter.length > 0) {
      andConditions.push({
        year: {
          contains: yearFilter,
          mode: Prisma.QueryMode.insensitive,
        },
      });
    }

    const where: Prisma.ProductWhereInput | undefined =
      andConditions.length > 0 ? { AND: andConditions } : undefined;

    const validSortFields: Record<string, keyof Prisma.ProductOrderByWithRelationInput> = {
      slug: 'slug',
      category: 'category',
      material: 'material',
      year: 'year',
      createdAt: 'createdAt',
    };

    const orderByField = validSortFields[sortField] || 'createdAt';
    const orderByDirection = sortDirection === 'asc' ? 'asc' : 'desc';

    const locale = searchParams.get('locale') || 'vi';
    
    const [total, items] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy: {
          [orderByField]: orderByDirection,
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          translations: true,
        },
      }),
    ]);

    // Transform items to include translation data for the requested locale
    const transformedItems = items.map(product => {
      const translation = product.translations.find(t => t.locale === locale) 
        || product.translations.find(t => t.locale === 'vi') 
        || product.translations[0];

      return {
        ...product,
        title: translation?.title || '',
        descriptions: translation?.descriptions || [],
        content: translation?.content || '',
      };
    });

    return Response.json({ items: transformedItems, total, page, pageSize });
  } catch (error) {
    console.error('Error fetching products:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return Response.json(
      { error: 'Failed to fetch products', details: errorMessage },
      { status: 500 }
    );
  }
}

