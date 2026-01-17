import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, checkAdminAuth } from '@/lib/auth';

interface CategoryTranslation {
  locale: string;
  name: string;
}

interface CategoryWithTranslations {
  id: string;
  slug: string;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
  translations: CategoryTranslation[];
}

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
    const q = searchParams.get('q')?.trim().toLowerCase() || '';

    const categories = await prisma.productCategory.findMany({
      orderBy: [
        { displayOrder: 'asc' },
        { createdAt: 'desc' }
      ],
      where: q
        ? {
            translations: {
              some: {
                name: { contains: q, mode: 'insensitive' },
              },
            },
          }
        : undefined,
      include: {
        translations: true,
      }
    }) as unknown as CategoryWithTranslations[];

    const transformedCategories = categories.map((category) => {
      const defaultTranslation = category.translations.find(t => t.locale === locale)
        || category.translations.find(t => t.locale === 'vi')
        || category.translations.find(t => t.locale === 'en')
        || category.translations[0];

      return {
        id: category.id,
        slug: category.slug,
        displayOrder: category.displayOrder,
        name: defaultTranslation?.name || '',
        translations: category.translations.map(t => ({ locale: t.locale, name: t.name })),
        createdAt: category.createdAt.toISOString(),
        updatedAt: category.updatedAt.toISOString(),
      };
    });

    return Response.json({ items: transformedCategories });
  } catch (error) {
    console.error('Error fetching product categories:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return Response.json(
      { error: 'Failed to fetch product categories', details: errorMessage },
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
    const { slug, displayOrder, translations } = body;

    if (!slug || !translations || typeof translations !== 'object') {
      return Response.json(
        { error: 'Missing required fields: slug and translations' },
        { status: 400 }
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

    // Check if slug already exists
    const existing = await prisma.productCategory.findUnique({
      where: { slug }
    });

    if (existing) {
      return Response.json(
        { error: 'Product category with this slug already exists' },
        { status: 400 }
      );
    }

    const category = await prisma.productCategory.create({
      data: {
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
        translations: true
      }
    });

    const defaultTranslation = category.translations.find(t => t.locale === 'vi')
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
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating product category:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return Response.json(
      { error: 'Failed to create product category', details: errorMessage },
      { status: 500 }
    );
  }
}
