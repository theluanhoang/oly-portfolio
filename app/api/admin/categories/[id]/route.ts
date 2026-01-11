import { prisma } from '@/lib/prisma';
import type { Prisma } from '../../../../generated/prisma/client';
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

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        translations: true,
        subCategories: {
          orderBy: [
            { displayOrder: 'asc' },
            { createdAt: 'desc' }
          ],
          include: {
            translations: true,
          }
        }
      }
    });

    if (!category) {
      return Response.json(
        { error: 'Category not found' },
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
      subCategories: category.subCategories.map(subCat => {
        const subDefaultTranslation = subCat.translations.find(t => t.locale === locale)
          || subCat.translations.find(t => t.locale === 'vi')
          || subCat.translations.find(t => t.locale === 'en')
          || subCat.translations[0];

        return {
          id: subCat.id,
          categoryId: subCat.categoryId,
          slug: subCat.slug,
          displayOrder: subCat.displayOrder,
          name: subDefaultTranslation?.name || '',
          translations: subCat.translations.map(t => ({
            locale: t.locale,
            name: t.name,
          })),
          createdAt: subCat.createdAt.toISOString(),
          updatedAt: subCat.updatedAt.toISOString(),
        };
      }),
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return Response.json(
      { error: 'Failed to fetch category', details: errorMessage },
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

    const category = await prisma.category.findUnique({
      where: { id }
    });

    if (!category) {
      return Response.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if slug is being changed and if it already exists
    if (slug && slug !== category.slug) {
      const existing = await prisma.category.findUnique({
        where: { slug }
      });

      if (existing) {
        return Response.json(
          { error: 'Category with this slug already exists' },
          { status: 400 }
        );
      }
    }

    // Update category
    const updateData: Prisma.CategoryUpdateInput = {};
    if (slug !== undefined) updateData.slug = slug;
    if (displayOrder !== undefined) updateData.displayOrder = displayOrder;

    // Update translations if provided
    if (translations && typeof translations === 'object') {
      const locales = Object.keys(translations);
      
      // Delete existing translations and create new ones
      await prisma.categoryTranslation.deleteMany({
        where: { categoryId: id }
      });

      updateData.translations = {
        create: locales.map(locale => ({
          locale,
          name: translations[locale].name,
        }))
      };
    }

    const updatedCategory = await prisma.category.update({
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
    console.error('Error updating category:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return Response.json(
      { error: 'Failed to update category', details: errorMessage },
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
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        projects: true,
        subCategories: true,
      }
    });

    if (!category) {
      return Response.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if category is being used by any projects
    if (category.projects.length > 0) {
      return Response.json(
        { error: 'Cannot delete category that is being used by projects' },
        { status: 400 }
      );
    }

    // Delete category (translations and subcategories will be cascade deleted)
    await prisma.category.delete({
      where: { id }
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return Response.json(
      { error: 'Failed to delete category', details: errorMessage },
      { status: 500 }
    );
  }
}

