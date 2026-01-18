import { prisma } from '@/lib/prisma';

export async function GET(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale')?.trim() || 'vi';

    const subCategories = await prisma.subCategory.findMany({
      orderBy: [
        { displayOrder: 'asc' },
        { createdAt: 'desc' }
      ],
      include: {
        translations: true
      }
    });

    const transformedSubCategories = subCategories.map((subCategory) => {
      const defaultTranslation = subCategory.translations.find(t => t.locale === locale)
        || subCategory.translations.find(t => t.locale === 'vi')
        || subCategory.translations.find(t => t.locale === 'en')
        || subCategory.translations[0];

      return {
        id: subCategory.id,
        slug: subCategory.slug,
        name: defaultTranslation?.name || '',
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
