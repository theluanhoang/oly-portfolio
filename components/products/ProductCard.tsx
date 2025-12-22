interface ProductCardProps {
  id: string;
  slug: string;
  category: string;
  year: string;
  thumbnail: string;
}

function getDisplayName(slug: string) {
  if (!slug) return 'Product';
  return slug.replace(/-/g, ' ').toUpperCase();
}

export function ProductCard({ product }: { product: ProductCardProps }) {
  return (
    <article className="product-card-border bg-white px-[26px] py-6">
      <div className="aspect-square overflow-hidden">
        <img
          src={product.thumbnail}
          alt={getDisplayName(product.slug)}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="mt-3">
        <h2 className="text-black text-[12px] font-bold tracking-[1.68px] uppercase">
          {getDisplayName(product.slug)}
        </h2>
        <p className="text-black text-[12px] font-bold tracking-[1.68px] mt-[8px]">
          {product.category}
        </p>
      </div>
    </article>
  );
}


