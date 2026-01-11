import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, checkAdminAuth } from '@/lib/auth';
import type { Prisma } from '../../../generated/prisma/client';

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const session = await getServerSession(authOptions);
    const adminCheck = await checkAdminAuth(session);
    if (adminCheck) {
      return Response.json(
        { error: adminCheck.error },
        { status: adminCheck.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale')?.trim() || 'vi';
    const categoryId = searchParams.get('categoryId')?.trim();
    const q = searchParams.get('q')?.trim().toLowerCase() || '';

    const where: Prisma.SubCategoryWhereInput = {};
    if (categoryId) {
      where.categoryId = categoryId;
    }

    const subCategories = await prisma.subCategory.findMany({
      where,
      orderBy: [
        { displayOrder: 'asc' },
        { createdAt: 'desc' }
      ],
      ...(q
        ? {
            where: {
              ...where,
              translations: {
                some: {
                  name: { contains: q, mode: 'insensitive' },
                },
              },
            },
          }
        : {}),
      include: {
        translations: true,
        category: {
          include: {
            translations: true,
          }
        }
      }
    });

    const transformedSubCategories = subCategories.map(subCat => {
      const defaultTranslation = subCat.translations.find(t => t.locale === locale)
        || subCat.translations.find(t => t.locale === 'vi')
        || subCat.translations.find(t => t.locale === 'en')
        || subCat.translations[0];

      const categoryDefaultTranslation = subCat.category.translations.find(t => t.locale === locale)
        || subCat.category.translations.find(t => t.locale === 'vi')
        || subCat.category.translations.find(t => t.locale === 'en')
        || subCat.category.translations[0];

      return {
        id: subCat.id,
        categoryId: subCat.categoryId,
        categoryName: categoryDefaultTranslation?.name || '',
        slug: subCat.slug,
        displayOrder: subCat.displayOrder,
        name: defaultTranslation?.name || '',
        createdAt: subCat.createdAt.toISOString(),
        updatedAt: subCat.updatedAt.toISOString(),
      };
    });

    return Response.json({ items: transformedSubCategories });
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return Response.json(
      { error: 'Failed to fetch subcategories', details: errorMessage },
      { status: 500 }
    );
  }
}

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
    const body = await request.json();
    const { categoryId, slug, displayOrder, translations } = body;

    if (!categoryId || !slug || !translations || typeof translations !== 'object') {
      return Response.json(
        { error: 'Missing required fields: categoryId, slug and translations' },
        { status: 400 }
      );
    }

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      return Response.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Validate translations
    const locales = Object.keys(translations);
    if (locales.length === 0) {
      return Response.json(
        { error: 'At least one translation is required' },
        { status: 400 }
      );
    }

    for (const locale of locales) {
      if (!translations[locale]?.name) {
        return Response.json(
          { error: `Translation for locale '${locale}' must have a name` },
          { status: 400 }
        );
      }
    }

    // Check if slug already exists for this category
    const existing = await prisma.subCategory.findUnique({
      where: {
        categoryId_slug: {
          categoryId,
          slug
        }
      }
    });

    if (existing) {
      return Response.json(
        { error: 'SubCategory with this slug already exists for this category' },
        { status: 400 }
      );
    }

    const subCategory = await prisma.subCategory.create({
      data: {
        categoryId,
        slug,
        displayOrder: displayOrder || 0,
        translations: {
          create: locales.map(locale => ({
            locale,
            name: translations[locale].name,
          }))
        }
      },
      include: {
        translations: true,
        category: {
          include: {
            translations: true,
          }
        }
      }
    });

    const defaultTranslation = subCategory.translations.find(t => t.locale === 'vi')
      || subCategory.translations.find(t => t.locale === 'en')
      || subCategory.translations[0];

    const categoryDefaultTranslation = subCategory.category.translations.find(t => t.locale === 'vi')
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
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating subcategory:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return Response.json(
      { error: 'Failed to create subcategory', details: errorMessage },
      { status: 500 }
    );
  }
}

