"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Product {
  slug: string;
  title?: string;
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
  const hasDescriptions = descriptions.length > 0;

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
      <div className={`flex flex-col lg:flex-row ${hasDescriptions ? 'justify-between' : 'justify-start'} items-stretch`}>
        {/* Left Column - Only show when descriptions exist */}
        {hasDescriptions && (
          <div className="flex flex-col justify-between">
            {/* Prologue Section */}
            <div className="mb-6 sm:mb-5 flex-1 flex flex-col">
              <h2 className="text-black font-medium text-xs sm:text-sm tracking-wide uppercase mb-3 sm:mb-4 shrink-0">
                {t("prologue")}
              </h2>
              <div className="relative overflow-hidden flex-1 flex items-start">
                <div
                  key={descriptionIndex}
                  className={`text-black text-xs sm:text-sm leading-relaxed font-light transition-all duration-500 ease-in-out w-[443px] max-h-[200px] overflow-y-auto ${
                    slideDirection === "left"
                      ? "animate-slide-in-left"
                      : "animate-slide-in-right"
                  }`}
                >
                  <p className="text-justify">{descriptions[descriptionIndex]}</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav aria-label="Product description navigation" className="flex justify-between items-center mt-6 lg:mt-0">
              {hasPrev ? (
                <button
                  onClick={handlePrev}
                  aria-label="Previous description"
                  className="text-black text-xs sm:text-sm tracking-wide underline hover:no-underline cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                  Prev
                </button>
              ) : (
                <span className="text-gray-400 text-xs sm:text-sm flex items-center gap-1" aria-disabled="true">
                  <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                  Prev
                </span>
              )}
              {hasNext ? (
                <button
                  onClick={handleNext}
                  aria-label="Next description"
                  className="text-black text-xs sm:text-sm tracking-wide underline hover:no-underline cursor-pointer flex items-center gap-1"
                >
                  Next
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </button>
              ) : (
                <span className="text-gray-400 text-xs sm:text-sm flex items-center gap-1" aria-disabled="true">
                  Next
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </span>
              )}
            </nav>
          </div>
        )}

        {/* Right Column - Becomes left when no descriptions */}
        <div className={`flex flex-col justify-between ${hasDescriptions ? 'lg:mt-8 sm:mt-8 mt-5' : 'mt-0'}`}>
          <div className="flex flex-row items-start justify-between gap-0 md:gap-[108px] mb-8 lg:mb-12">
            {/* Related Product */}
              <div className="">
                <h3 className="text-black font-gayathri text-[18px] sm:text-[20px] lg:text-[22px] font-bold tracking-[2.52px] sm:tracking-[2.8px] lg:tracking-[3.08px] uppercase">
                  {product.title || getDisplayName(product.slug)}
                </h3>
                <p className="text-black text-xs sm:text-sm font-light tracking-wide mt-1">
                  {product.category}
                </p>
              </div>

            {/* Attributes */}
            <div className="space-y-2 text-black text-xs sm:text-sm font-light tracking-wide">
              <p>Category// {category}</p>
              <p>Material// {material}</p>
              <p>{year}</p>
            </div>
          </div>

          {/* Order Button */}
          <div className="mt-auto lg:mt-0">
            <button 
              aria-label={`Order ${product.title || getDisplayName(product.slug)}`}
              className="border border-black text-black text-xs sm:text-sm tracking-wide hover:bg-black hover:text-white transition-colors w-full sm:w-auto" 
              style={{ width: '113px', padding: '10px', gap: '10px' }}
            >
              {t("order")}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
