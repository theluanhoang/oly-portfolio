import prisma from '@/lib/prisma';

export async function getProducts() {
  try {
    const prismaWithProduct = prisma as typeof prisma & {
      product: {
        findMany(args: { orderBy: { createdAt: 'desc' } }): Promise<unknown[]>;
      };
    };

    const products = await prismaWithProduct.product.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    return products;
  } catch (error) {
    console.error('Error fetching products from database:', error);
    return [];
  }
}

export async function getProductBySlug(slug: string) {
  try {
    const prismaWithProduct = prisma as typeof prisma & {
      product: {
        findUnique(args: { where: { slug: string } }): Promise<unknown | null>;
      };
    };

    const product = await prismaWithProduct.product.findUnique({
      where: { slug },
    });
    return product;
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


