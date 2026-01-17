import { prisma } from '@/lib/prisma';
import type { Prisma } from '../../../../../app/generated/prisma/client';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, checkAdminAuth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const session = await getServerSession(authOptions);
    const adminCheck = await checkAdminAuth(session);
    if (adminCheck) {
      return Response.json(
        { error: adminCheck.error },
        { status: adminCheck.status }
      );
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale')?.trim() || 'vi';

    const category = await prisma.productCategory.findUnique({
      where: { id },
      include: {
        translations: true,
      }
    });

    if (!category) {
      return Response.json(
        { error: 'Product category not found' },
        { status: 404 }
      );
    }

    const defaultTranslation = category.translations.find(t => t.locale === locale)
      || category.translations.find(t => t.locale === 'vi')
      || category.translations.find(t => t.locale === 'en')
      || category.translations[0];

    return Response.json({
      id: category.id,
      slug: category.slug,
      displayOrder: category.displayOrder,
      name: defaultTranslation?.name || '',
      translations: category.translations.map(t => ({
        locale: t.locale,
        name: t.name,
      })),
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching product category:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return Response.json(
      { error: 'Failed to fetch product category', details: errorMessage },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const session = await getServerSession(authOptions);
    const adminCheck = await checkAdminAuth(session);
    if (adminCheck) {
      return Response.json(
        { error: adminCheck.error },
        { status: adminCheck.status }
      );
    }
    const { id } = await params;
    const body = await request.json();
    const { slug, displayOrder, translations } = body;

    const category = await prisma.productCategory.findUnique({
      where: { id }
    });

    if (!category) {
      return Response.json(
        { error: 'Product category not found' },
        { status: 404 }
      );
    }

    // Check if slug is being changed and if it already exists
    if (slug && slug !== category.slug) {
      const existing = await prisma.productCategory.findUnique({
        where: { slug }
      });

      if (existing) {
        return Response.json(
          { error: 'Product category with this slug already exists' },
          { status: 400 }
        );
      }
    }

    // Update category
    const updateData: Prisma.ProductCategoryUpdateInput = {};
    if (slug !== undefined) updateData.slug = slug;
    if (displayOrder !== undefined) updateData.displayOrder = displayOrder;

    // Update translations if provided
    if (translations && typeof translations === 'object') {
      const locales = Object.keys(translations);
      
      // Delete existing translations and create new ones
      await prisma.productCategoryTranslation.deleteMany({
        where: { categoryId: id }
      });

      updateData.translations = {
        create: locales.map(locale => ({
          locale,
          name: translations[locale].name,
        }))
      };
    }

    const updatedCategory = await prisma.productCategory.update({
      where: { id },
      data: updateData,
      include: {
        translations: true
      }
    });

    const defaultTranslation = updatedCategory.translations.find(t => t.locale === 'vi')
      || updatedCategory.translations.find(t => t.locale === 'en')
      || updatedCategory.translations[0];

    return Response.json({
      id: updatedCategory.id,
      slug: updatedCategory.slug,
      displayOrder: updatedCategory.displayOrder,
      name: defaultTranslation?.name || '',
      translations: updatedCategory.translations.map(t => ({
        locale: t.locale,
        name: t.name,
      })),
      createdAt: updatedCategory.createdAt.toISOString(),
      updatedAt: updatedCategory.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error updating product category:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return Response.json(
      { error: 'Failed to update product category', details: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const session = await getServerSession(authOptions);
    const adminCheck = await checkAdminAuth(session);
    if (adminCheck) {
      return Response.json(
        { error: adminCheck.error },
        { status: adminCheck.status }
      );
    }
    const { id } = await params;
    const category = await prisma.productCategory.findUnique({
      where: { id },
      include: {
        products: true,
      }
    });

    if (!category) {
      return Response.json(
        { error: 'Product category not found' },
        { status: 404 }
      );
    }

    // Check if category is being used by any products
    if (category.products.length > 0) {
      return Response.json(
        { error: 'Cannot delete product category that is being used by products' },
        { status: 400 }
      );
    }

    // Delete category (translations will be cascade deleted)
    await prisma.productCategory.delete({
      where: { id }
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting product category:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return Response.json(
      { error: 'Failed to delete product category', details: errorMessage },
      { status: 500 }
    );
  }
}
