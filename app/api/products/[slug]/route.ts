import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(request: Request, { params }: RouteParams): Promise<Response> {
  try {
    const { slug } = await params;
    const prismaWithProduct = prisma as typeof prisma & {
      product: {
        findUnique(args: { where: { slug: string } }): Promise<unknown | null>;
      };
    };

    const product = await prismaWithProduct.product.findUnique({
      where: { slug },
    });

    if (!product) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }

    return Response.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return Response.json(
      { error: 'Failed to fetch product', details: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams): Promise<Response> {
  try {
    const { slug } = await params;
    const prismaWithProduct = prisma as typeof prisma & {
      product: {
        delete(args: { where: { slug: string } }): Promise<unknown>;
      };
    };

    const deleted = await prismaWithProduct.product.delete({
      where: { slug },
    });

    return Response.json(deleted);
  } catch (error) {
    console.error('Error deleting product:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return Response.json(
      { error: 'Failed to delete product', details: errorMessage },
      { status: 500 }
    );
  }
}

