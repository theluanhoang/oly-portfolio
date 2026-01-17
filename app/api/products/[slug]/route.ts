import { prisma } from '@/lib/prisma';
import { productSchema } from '@/lib/validations/productSchema';
import { getServerSession } from 'next-auth';
import { authOptions, checkAdminAuth } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(request: Request, { params }: RouteParams): Promise<Response> {
  try {
    const { slug } = await params;

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        translations: true,
      },
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
    const session = await getServerSession(authOptions);
    const adminCheck = await checkAdminAuth(session);
    if (adminCheck) {
      return Response.json(
        { error: adminCheck.error },
        { status: adminCheck.status }
      );
    }

    const { slug } = await params;
    const productData = await request.json();
    
    const existingProduct = await prisma.product.findUnique({
      where: { slug },
      include: {
        translations: true,
      },
    });

    if (!existingProduct) {
      return Response.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    if (productData.slug && productData.slug !== slug) {
      const slugExists = await prisma.product.findUnique({
        where: { slug: productData.slug },
      });
      if (slugExists) {
        return Response.json(
          { error: `Product with slug "${productData.slug}" already exists` },
          { status: 409 }
        );
      }
    }

    if (!productData.translations || Object.keys(productData.translations).length === 0) {
      return Response.json(
        { error: 'Missing required field: translations (at least one locale required)' },
        { status: 400 }
      );
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

    // Delete existing translations and create new ones
    await prisma.productTranslation.deleteMany({
      where: { productId: existingProduct.id },
    });

    const updated = await prisma.product.update({
      where: { slug },
      data: {
        slug: productData.slug || slug,
        category: productData.category || '',
        material: productData.material || '',
        year: productData.year || '',
        thumbnail: productData.thumbnail || '',
        translations: {
          create: Object
            .entries(productData.translations as Record<string, { title: string; descriptions?: string[]; content?: string }>)
            .map(([locale, translationData]) => ({
              locale,
              title: translationData.title || '',
              descriptions: translationData.descriptions || [],
              content: translationData.content || '',
            })),
        },
      },
      include: {
        translations: true,
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
    const session = await getServerSession(authOptions);
    const adminCheck = await checkAdminAuth(session);
    if (adminCheck) {
      return Response.json(
        { error: adminCheck.error },
        { status: adminCheck.status }
      );
    }

    const { slug } = await params;

    const deleted = await prisma.product.delete({
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

