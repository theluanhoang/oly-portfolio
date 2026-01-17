import { prisma } from '@/lib/prisma';

export async function GET(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale')?.trim() || 'vi';

    const categories = await prisma.category.findMany({
      orderBy: [
        { displayOrder: 'asc' },
        { createdAt: 'desc' }
      ],
      include: {
        translations: true
      }
    });

    const transformedCategories = categories.map((category) => {
      const defaultTranslation = category.translations.find(t => t.locale === locale)
        || category.translations.find(t => t.locale === 'vi')
        || category.translations.find(t => t.locale === 'en')
        || category.translations[0];

      return {
        id: category.id,
        slug: category.slug,
        name: defaultTranslation?.name || '',
      };
    });

    return Response.json({ items: transformedCategories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return Response.json(
      { error: 'Failed to fetch categories', details: errorMessage },
      { status: 500 }
    );
  }
}
