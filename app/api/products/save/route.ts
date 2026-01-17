import { prisma } from '@/lib/prisma';
import { productSchema } from '@/lib/validations/productSchema';
import type { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, checkAdminAuth } from '@/lib/auth';

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const session = await getServerSession(authOptions);
    const adminCheck = await checkAdminAuth(session);
    if (adminCheck) {
      return Response.json(
        { error: adminCheck.error },
        { status: adminCheck.status }
      );
    }

    const productData = await request.json();
    
    if (!productData.slug || !productData.category || !productData.material || !productData.year || !productData.thumbnail) {
      return Response.json(
        { error: 'Missing required fields: slug, category, material, year, thumbnail' },
        { status: 400 }
      );
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

    const existingProduct = await prisma.product.findUnique({
      where: { slug: productData.slug },
    });

    if (existingProduct) {
      return Response.json(
        { error: `Product with slug "${productData.slug}" already exists` },
        { status: 409 }
      );
    }

    const product = await prisma.product.create({
      data: {
        slug: productData.slug,
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
      message: 'Product saved successfully',
      product 
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error saving product:', error);
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return Response.json(
        { error: 'Product with this slug already exists' },
        { status: 409 }
      );
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return Response.json(
      { error: 'Failed to save product', details: errorMessage },
      { status: 500 }
    );
  }
}

