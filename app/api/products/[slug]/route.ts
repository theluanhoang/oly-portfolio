import { prisma } from '@/lib/prisma';
import { productSchema } from '@/lib/validations/productSchema';

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

export async function PUT(request: Request, { params }: RouteParams): Promise<Response> {
  try {
    const { slug } = await params;
    const productData = await request.json();
    
    const prismaWithProduct = prisma as typeof prisma & {
      product: {
        findUnique(args: { where: { slug: string } }): Promise<unknown | null>;
        update(args: { where: { slug: string }; data: unknown }): Promise<unknown>;
      };
    };

    const existingProduct = await prismaWithProduct.product.findUnique({
      where: { slug },
    });

    if (!existingProduct) {
      return Response.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    if (productData.slug && productData.slug !== slug) {
      const slugExists = await prismaWithProduct.product.findUnique({
        where: { slug: productData.slug },
      });
      if (slugExists) {
        return Response.json(
          { error: `Product with slug "${productData.slug}" already exists` },
          { status: 409 }
        );
      }
    }

    const validationResult = productSchema.safeParse(productData);
    if (!validationResult.success) {
      return Response.json(
        { 
          error: 'Validation failed', 
          details: validationResult.error.issues 
        },
        { status: 400 }
      );
    }

    const updated = await prismaWithProduct.product.update({
      where: { slug },
      data: {
        slug: productData.slug || slug,
        title: productData.title || '',
        category: productData.category || '',
        material: productData.material || '',
        year: productData.year || '',
        thumbnail: productData.thumbnail || '',
        descriptions: productData.descriptions || [],
        content: productData.content || '',
      },
    });

    return Response.json({ 
      success: true, 
      message: 'Product updated successfully',
      product: updated 
    });
  } catch (error) {
    console.error('Error updating product:', error);
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return Response.json(
        { error: 'Product with this slug already exists' },
        { status: 409 }
      );
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return Response.json(
      { error: 'Failed to update product', details: errorMessage },
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

