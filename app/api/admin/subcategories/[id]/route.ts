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

    const subCategory = await prisma.subCategory.findUnique({
      where: { id },
      include: {
        translations: true,
        category: {
          include: {
            translations: true,
          }
        }
      }
    });

    if (!subCategory) {
      return Response.json(
        { error: 'SubCategory not found' },
        { status: 404 }
      );
    }

    const defaultTranslation = subCategory.translations.find(t => t.locale === locale)
      || subCategory.translations.find(t => t.locale === 'vi')
      || subCategory.translations.find(t => t.locale === 'en')
      || subCategory.translations[0];

    const categoryDefaultTranslation = subCategory.category.translations.find(t => t.locale === locale)
      || subCategory.category.translations.find(t => t.locale === 'vi')
      || subCategory.category.translations.find(t => t.locale === 'en')
      || subCategory.category.translations[0];

    return Response.json({
      id: subCategory.id,
      categoryId: subCategory.categoryId,
      categoryName: categoryDefaultTranslation?.name || '',
      slug: subCategory.slug,
      displayOrder: subCategory.displayOrder,
      name: defaultTranslation?.name || '',
      translations: subCategory.translations.map(t => ({
        locale: t.locale,
        name: t.name,
      })),
      createdAt: subCategory.createdAt.toISOString(),
      updatedAt: subCategory.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching subcategory:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return Response.json(
      { error: 'Failed to fetch subcategory', details: errorMessage },
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
    const { categoryId, slug, displayOrder, translations } = body;

    const subCategory = await prisma.subCategory.findUnique({
      where: { id }
    });

    if (!subCategory) {
      return Response.json(
        { error: 'SubCategory not found' },
        { status: 404 }
      );
    }

    // Check if categoryId is being changed and if new category exists
    if (categoryId && categoryId !== subCategory.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId }
      });

      if (!category) {
        return Response.json(
          { error: 'Category not found' },
          { status: 404 }
        );
      }
    }

    // Check if slug already exists in the target category
    const finalCategoryId = categoryId || subCategory.categoryId;
    const finalSlug = slug || subCategory.slug;
    
    // Only check if slug or categoryId is being changed
    if ((slug && slug !== subCategory.slug) || (categoryId && categoryId !== subCategory.categoryId)) {
      const existing = await prisma.subCategory.findUnique({
        where: {
          categoryId_slug: {
            categoryId: finalCategoryId,
            slug: finalSlug
          }
        }
      });

      // Only error if the existing SubCategory is different from the one being updated
      if (existing && existing.id !== id) {
        return Response.json(
          { error: 'SubCategory with this slug already exists for this category' },
          { status: 400 }
        );
      }
    }

    // Update subcategory
    const updateData: Prisma.SubCategoryUpdateInput = {};
    if (categoryId !== undefined) {
      updateData.category = { connect: { id: categoryId } };
    }
    if (slug !== undefined) updateData.slug = slug;
    if (displayOrder !== undefined) updateData.displayOrder = displayOrder;

    // Update translations if provided
    if (translations && typeof translations === 'object') {
      const locales = Object.keys(translations);
      
      // Delete existing translations and create new ones
      await prisma.subCategoryTranslation.deleteMany({
        where: { subCategoryId: id }
      });

      updateData.translations = {
        create: locales.map(locale => ({
          locale,
          name: translations[locale].name,
        }))
      };
    }

    const updatedSubCategory = await prisma.subCategory.update({
      where: { id },
      data: updateData,
      include: {
        translations: true,
        category: {
          include: {
            translations: true,
          }
        }
      }
    });

    const defaultTranslation = updatedSubCategory.translations.find(t => t.locale === 'vi')
      || updatedSubCategory.translations.find(t => t.locale === 'en')
      || updatedSubCategory.translations[0];

    const categoryDefaultTranslation = updatedSubCategory.category.translations.find(t => t.locale === 'vi')
      || updatedSubCategory.category.translations.find(t => t.locale === 'en')
      || updatedSubCategory.category.translations[0];

    return Response.json({
      id: updatedSubCategory.id,
      categoryId: updatedSubCategory.categoryId,
      categoryName: categoryDefaultTranslation?.name || '',
      slug: updatedSubCategory.slug,
      displayOrder: updatedSubCategory.displayOrder,
      name: defaultTranslation?.name || '',
      translations: updatedSubCategory.translations.map(t => ({
        locale: t.locale,
        name: t.name,
      })),
      createdAt: updatedSubCategory.createdAt.toISOString(),
      updatedAt: updatedSubCategory.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error updating subcategory:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return Response.json(
      { error: 'Failed to update subcategory', details: errorMessage },
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
    const subCategory = await prisma.subCategory.findUnique({
      where: { id },
      include: {
        projects: true,
      }
    });

    if (!subCategory) {
      return Response.json(
        { error: 'SubCategory not found' },
        { status: 404 }
      );
    }

    // Check if subcategory is being used by any projects
    if (subCategory.projects.length > 0) {
      return Response.json(
        { error: 'Cannot delete subcategory that is being used by projects' },
        { status: 400 }
      );
    }

    // Delete subcategory (translations will be cascade deleted)
    await prisma.subCategory.delete({
      where: { id }
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting subcategory:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return Response.json(
      { error: 'Failed to delete subcategory', details: errorMessage },
      { status: 500 }
    );
  }
}

