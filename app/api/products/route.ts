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
              contains: searchValue,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            material: {
              contains: searchValue,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            year: {
              contains: searchValue,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            descriptions: {
              has: searchValue,
            },
          },
        ],
      });
    }

    if (categoryFilter.length > 0) {
      andConditions.push({
        category: {
          contains: categoryFilter,
          mode: Prisma.QueryMode.insensitive,
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

    const [total, items] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return Response.json({ items, total, page, pageSize });
  } catch (error) {
    console.error('Error fetching products:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return Response.json(
      { error: 'Failed to fetch products', details: errorMessage },
      { status: 500 }
    );
  }
}

