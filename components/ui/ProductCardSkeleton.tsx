export function ProductCardSkeleton() {
  return (
    <article className="h-full max-w-[232px] border-0 lg:border-[0.5px] lg:border-product-border bg-white py-[13px] px-[12px] lg:px-[26px] lg:py-6 flex flex-col">
      <div className="aspect-square overflow-hidden bg-gray-200 animate-pulse">
        <div className="w-full h-full bg-gradient-to-br from-gray-200 via-gray-300 to-gray-200"></div>
      </div>
      <div className="mt-3 grow space-y-2">
        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
      </div>
    </article>
  );
}
