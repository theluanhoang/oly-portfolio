"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface Product {
  slug: string;
  category: string;
  material: string;
  year: string;
  descriptions?: string[];
}

interface RelatedProduct {
  slug: string;
  category: string;
}

interface ProductInfoProps {
  product: Product;
  relatedProduct?: RelatedProduct | null;
}

function getDisplayName(slug: string) {
  if (!slug) return "Product";
  return slug.replace(/-/g, " ").toUpperCase();
}

export default function ProductInfo({
  product,
  relatedProduct,
}: ProductInfoProps) {
  const { category, material, year, descriptions = [] } = product;
  const t = useTranslations("ProductInfo");
  const [descriptionIndex, setDescriptionIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState<"left" | "right">(
    "right"
  );

  const hasPrev = descriptionIndex > 0;
  const hasNext = descriptionIndex < descriptions.length - 1;

  const handlePrev = () => {
    if (hasPrev) {
      setSlideDirection("right");
      setDescriptionIndex(descriptionIndex - 1);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      setSlideDirection("left");
      setDescriptionIndex(descriptionIndex + 1);
    }
  };

  return (
    <section className="relative bg-background">
      {/* Title */}
      <h1 className="text-text-dark text-[28px] sm:text-[36px] lg:text-[48px] font-thin tracking-[3.92px] sm:tracking-[5.04px] lg:tracking-[6.72px] uppercase mb-8 sm:mb-12 lg:mb-[60px]">
        {getDisplayName(product.slug)}
      </h1>
      <div className="flex flex-col lg:flex-row justify-between items-stretch">
        {/* Left Column */}
        <div className="flex flex-col justify-between">
          {/* Prologue Section */}
          {descriptions.length > 0 && (
            <div className="mb-6 sm:mb-5 flex-1 flex flex-col">
              <h2 className="text-black font-medium text-xs sm:text-sm tracking-wide uppercase mb-3 sm:mb-4 shrink-0">
                {t("prologue")}
              </h2>
              <div className="relative overflow-hidden flex-1 flex items-start">
                <div
                  key={descriptionIndex}
                  className={`text-black text-xs sm:text-sm leading-relaxed font-light transition-all duration-500 ease-in-out w-full ${
                    slideDirection === "left"
                      ? "animate-slide-in-left"
                      : "animate-slide-in-right"
                  }`}
                >
                  <p>{descriptions[descriptionIndex]}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center mt-6 lg:mt-0">
            {hasPrev ? (
              <button
                onClick={handlePrev}
                className="text-black text-xs sm:text-sm tracking-wide underline hover:no-underline cursor-pointer"
              >
                Prev &gt;&gt;
              </button>
            ) : (
              <span className="text-gray-400 text-xs sm:text-sm">Prev &gt;&gt;</span>
            )}
            {hasNext ? (
              <button
                onClick={handleNext}
                className="text-black text-xs sm:text-sm tracking-wide underline hover:no-underline cursor-pointer"
              >
                Next &gt;&gt;
              </button>
            ) : (
              <span className="text-gray-400 text-xs sm:text-sm">Next &gt;&gt;</span>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col justify-between lg:mt-0 mt-5">
          <div className="flex flex-col sm:flex-row lg:flex-col justify-between gap-6 sm:gap-8 lg:gap-0 mb-8 lg:mb-12">
            {/* Related Product */}
            {relatedProduct && (
              <div className="">
                <h3 className="text-black font-gayathri text-[18px] sm:text-[20px] lg:text-[22px] font-bold tracking-[2.52px] sm:tracking-[2.8px] lg:tracking-[3.08px] uppercase">
                  {getDisplayName(relatedProduct.slug)}
                </h3>
                <p className="text-black text-xs sm:text-sm font-light tracking-wide mt-1">
                  {relatedProduct.category}
                </p>
              </div>
            )}

            {/* Attributes */}
            <div className="space-y-2 text-black text-xs sm:text-sm font-light tracking-wide mt-4">
              <p>Category// {category}</p>
              <p>Material// {material}</p>
              <p>{year}</p>
            </div>
          </div>

          {/* Order Button */}
          <div className="mt-auto lg:mt-0">
            <button className="border border-black text-black text-xs sm:text-sm tracking-wide hover:bg-black hover:text-white transition-colors w-full sm:w-auto" style={{ width: '113px', padding: '10px', gap: '10px' }}>
              {t("order")}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
