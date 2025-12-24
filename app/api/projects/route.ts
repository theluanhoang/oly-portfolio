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
            title: {
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
            type: {
              contains: searchValue,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            location: {
              contains: searchValue,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            area: {
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

    if (locationFilter.length > 0) {
      andConditions.push({
        location: {
          contains: locationFilter,
          mode: Prisma.QueryMode.insensitive,
        },
      });
    }

    const where: Prisma.ProjectWhereInput | undefined =
      andConditions.length > 0 ? { AND: andConditions } : undefined;

    const validSortFields: Record<string, keyof Prisma.ProjectOrderByWithRelationInput> = {
      title: 'title',
      category: 'category',
      location: 'location',
      year: 'year',
      createdAt: 'createdAt',
    };

    const orderByField = validSortFields[sortField] || 'createdAt';
    const orderByDirection = sortDirection === 'asc' ? 'asc' : 'desc';

    const [total, items] = await Promise.all([
      prisma.project.count({ where }),
      prisma.project.findMany({
        where,
        orderBy: {
          [orderByField]: orderByDirection,
        },
        ...(pageSize !== undefined && {
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
      }),
    ]);

    return Response.json({ items, total, page, pageSize: pageSize || total });
  } catch (error) {
    console.error('Error fetching projects:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return Response.json(
      { error: 'Failed to fetch projects', details: errorMessage },
      { status: 500 }
    );
  }
}

