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

    const material = await prisma.productMaterial.findUnique({
      where: { id },
      include: {
        translations: true,
      }
    });

    if (!material) {
      return Response.json(
        { error: 'Product material not found' },
        { status: 404 }
      );
    }

    const defaultTranslation = material.translations.find(t => t.locale === locale)
      || material.translations.find(t => t.locale === 'vi')
      || material.translations.find(t => t.locale === 'en')
      || material.translations[0];

    return Response.json({
      id: material.id,
      slug: material.slug,
      displayOrder: material.displayOrder,
      name: defaultTranslation?.name || '',
      translations: material.translations.map(t => ({
        locale: t.locale,
        name: t.name,
      })),
      createdAt: material.createdAt.toISOString(),
      updatedAt: material.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching product material:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return Response.json(
      { error: 'Failed to fetch product material', details: errorMessage },
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

    const material = await prisma.productMaterial.findUnique({
      where: { id }
    });

    if (!material) {
      return Response.json(
        { error: 'Product material not found' },
        { status: 404 }
      );
    }

    // Check if slug is being changed and if it already exists
    if (slug && slug !== material.slug) {
      const existing = await prisma.productMaterial.findUnique({
        where: { slug }
      });

      if (existing) {
        return Response.json(
          { error: 'Product material with this slug already exists' },
          { status: 400 }
        );
      }
    }

    // Update material
    const updateData: Prisma.ProductMaterialUpdateInput = {};
    if (slug !== undefined) updateData.slug = slug;
    if (displayOrder !== undefined) updateData.displayOrder = displayOrder;

    // Update translations if provided
    if (translations && typeof translations === 'object') {
      const locales = Object.keys(translations);
      
      // Delete existing translations and create new ones
      await prisma.productMaterialTranslation.deleteMany({
        where: { materialId: id }
      });

      updateData.translations = {
        create: locales.map(locale => ({
          locale,
          name: translations[locale].name,
        }))
      };
    }

    const updatedMaterial = await prisma.productMaterial.update({
      where: { id },
      data: updateData,
      include: {
        translations: true
      }
    });

    const defaultTranslation = updatedMaterial.translations.find(t => t.locale === 'vi')
      || updatedMaterial.translations.find(t => t.locale === 'en')
      || updatedMaterial.translations[0];

    return Response.json({
      id: updatedMaterial.id,
      slug: updatedMaterial.slug,
      displayOrder: updatedMaterial.displayOrder,
      name: defaultTranslation?.name || '',
      translations: updatedMaterial.translations.map(t => ({
        locale: t.locale,
        name: t.name,
      })),
      createdAt: updatedMaterial.createdAt.toISOString(),
      updatedAt: updatedMaterial.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error updating product material:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return Response.json(
      { error: 'Failed to update product material', details: errorMessage },
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
    const material = await prisma.productMaterial.findUnique({
      where: { id },
      include: {
        products: true,
      }
    });

    if (!material) {
      return Response.json(
        { error: 'Product material not found' },
        { status: 404 }
      );
    }

    // Check if material is being used by any products
    if (material.products.length > 0) {
      return Response.json(
        { error: 'Cannot delete product material that is being used by products' },
        { status: 400 }
      );
    }

    // Delete material (translations will be cascade deleted)
    await prisma.productMaterial.delete({
      where: { id }
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting product material:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return Response.json(
      { error: 'Failed to delete product material', details: errorMessage },
      { status: 500 }
    );
  }
}
