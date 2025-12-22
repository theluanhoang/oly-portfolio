import { prisma } from '@/lib/prisma';

export async function GET(): Promise<Response> {
  try {
    const products = await prisma.product.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return Response.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return Response.json(
      { error: 'Failed to fetch products', details: errorMessage },
      { status: 500 }
    );
  }
}


