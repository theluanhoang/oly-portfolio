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
    const locationFilter = searchParams.get('location')?.trim() || '';
    const locale = searchParams.get('locale')?.trim() || 'vi'; // Default locale for admin
    const searchValue = search.toLowerCase();

    const hasPagination = pageParam !== null || pageSizeParam !== null;
    const page = hasPagination ? Math.max(Number(pageParam) || 1, 1) : 1;
    const pageSize = hasPagination 
      ? Math.min(Math.max(Number(pageSizeParam) || 12, 1), 100)
      : undefined;
    const sortField = searchParams.get('sortField')?.trim() || 'createdAt';
    const sortDirection = searchParams.get('sortDirection')?.trim() || 'desc';

    const andConditions: Prisma.ProjectWhereInput[] = [];

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
            translations: {
              some: {
                OR: [
                  { title: { contains: searchValue, mode: Prisma.QueryMode.insensitive } },
                  { location: { contains: searchValue, mode: Prisma.QueryMode.insensitive } },
                  { area: { contains: searchValue, mode: Prisma.QueryMode.insensitive } },
                  { year: { contains: searchValue, mode: Prisma.QueryMode.insensitive } },
                ],
              },
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
            subCategory: {
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
        ],
      });
    }

    if (categoryFilter.length > 0) {
      andConditions.push({
        subCategory: {
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
        translations: {
          some: {
        year: {
          contains: yearFilter,
          mode: Prisma.QueryMode.insensitive,
            },
          },
        },
      });
    }

    if (locationFilter.length > 0) {
      andConditions.push({
        translations: {
          some: {
        location: {
          contains: locationFilter,
          mode: Prisma.QueryMode.insensitive,
            },
          },
        },
      });
    }

    const where: Prisma.ProjectWhereInput | undefined =
      andConditions.length > 0 ? { AND: andConditions } : undefined;

    const orderBy: Prisma.ProjectOrderByWithRelationInput | Prisma.ProjectOrderByWithRelationInput[] = 
      sortField === 'displayOrder'
        ? [
            { displayOrder: sortDirection === 'asc' ? 'asc' : 'desc' },
            { createdAt: 'desc' }
          ]
        : sortField === 'createdAt'
        ? { createdAt: sortDirection === 'asc' ? 'asc' : 'desc' }
        : { createdAt: 'desc' };

    const [total, items] = await Promise.all([
      prisma.project.count({ where }),
      prisma.project.findMany({
        where,
        orderBy,
        include: {
          translations: true,
          category: {
            include: {
              translations: true,
            },
          },
          subCategory: {
            include: {
              translations: true,
            },
          },
        },
        ...(pageSize !== undefined && {
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
      }),
    ]);

    const transformedItems = items.map((project) => {
      const defaultTranslation = project.translations.find(t => t.locale === locale) 
        || project.translations.find(t => t.locale === 'vi')
        || project.translations.find(t => t.locale === 'en')
        || project.translations[0];

      const categoryTranslation = project.category?.translations.find(t => t.locale === locale)
        || project.category?.translations.find(t => t.locale === 'vi')
        || project.category?.translations.find(t => t.locale === 'en')
        || project.category?.translations[0];

      const subCategoryTranslation = project.subCategory?.translations.find(t => t.locale === locale)
        || project.subCategory?.translations.find(t => t.locale === 'vi')
        || project.subCategory?.translations.find(t => t.locale === 'en')
        || project.subCategory?.translations[0];

      return {
        ...project,
        title: defaultTranslation?.title || '',
        category: categoryTranslation?.name || '',
        categoryId: project.categoryId,
        type: subCategoryTranslation?.name || '',
        subCategoryId: project.subCategoryId,
        location: defaultTranslation?.location || '',
        area: defaultTranslation?.area || '',
        year: defaultTranslation?.year || '',
        content: defaultTranslation?.content || '',
        heroImage: project.heroImage,
      };
    });

    return Response.json({ items: transformedItems, total, page, pageSize: pageSize || total });
  } catch (error) {
    console.error('Error fetching projects:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return Response.json(
      { error: 'Failed to fetch projects', details: errorMessage },
      { status: 500 }
    );
  }
}

