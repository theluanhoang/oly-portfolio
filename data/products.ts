import prisma from '@/lib/prisma';

export async function getProducts(locale?: string) {
  try {
    const products = await prisma.product.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        translations: true,
        category: {
          include: {
            translations: true,
          }
        },
        material: {
          include: {
            translations: true,
          }
        }
      },
    });

    // Transform to include translation data for the requested locale
    return products.map(product => {
      const translation = locale 
        ? product.translations.find(t => t.locale === locale) 
        : product.translations.find(t => t.locale === 'vi') || product.translations[0];

      const categoryTranslation = product.category?.translations.find(t => t.locale === locale)
        || product.category?.translations.find(t => t.locale === 'vi')
        || product.category?.translations.find(t => t.locale === 'en')
        || product.category?.translations[0];

      const materialTranslation = product.material?.translations.find(t => t.locale === locale)
        || product.material?.translations.find(t => t.locale === 'vi')
        || product.material?.translations.find(t => t.locale === 'en')
        || product.material?.translations[0];

      return {
        ...product,
        title: translation?.title || '',
        descriptions: translation?.descriptions || [],
        content: translation?.content || '',
        category: categoryTranslation?.name || '',
        material: materialTranslation?.name || '',
      };
    });
  } catch (error) {
    console.error('Error fetching products from database:', error);
    return [];
  }
}

export async function getProductBySlug(slug: string, locale?: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        translations: true,
        category: {
          include: {
            translations: true,
          }
        },
        material: {
          include: {
            translations: true,
          }
        }
      },
    });
    
    if (!product) {
      return null;
    }

    // Transform to include translation data for the requested locale
    const translation = locale 
      ? product.translations.find(t => t.locale === locale) 
      : product.translations.find(t => t.locale === 'vi') || product.translations[0];

    const categoryTranslation = product.category?.translations.find(t => t.locale === locale)
      || product.category?.translations.find(t => t.locale === 'vi')
      || product.category?.translations.find(t => t.locale === 'en')
      || product.category?.translations[0];

    const materialTranslation = product.material?.translations.find(t => t.locale === locale)
      || product.material?.translations.find(t => t.locale === 'vi')
      || product.material?.translations.find(t => t.locale === 'en')
      || product.material?.translations[0];

    return {
      ...product,
      title: translation?.title || '',
      descriptions: translation?.descriptions || [],
      content: translation?.content || '',
      category: categoryTranslation?.name || '',
      material: materialTranslation?.name || '',
      translation,
      translations: product.translations,
    };
  } catch (error) {
    console.error('Error fetching product by slug:', error);
    return null;
  }
}

export async function getAllProductSlugs(): Promise<string[]> {
  try {
    const prismaWithProduct = prisma as typeof prisma & {
      product: {
        findMany(args: { select: { slug: true } }): Promise<Array<{ slug: string }>>;
      };
    };

    const products = await prismaWithProduct.product.findMany({
      select: { slug: true },
    });
    return products.map((product) => product.slug);
  } catch (error) {
    console.error('Error fetching product slugs:', error);
    return [];
  }
}


