'use client';

import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Button from '@/components/ui/Button';

interface ProductsFilterDialogProps {
  isOpen: boolean;
  category: string;
  year: string;
  onCategoryChange: (value: string) => void;
  onYearChange: (value: string) => void;
  onReset: () => void;
  onClose: () => void;
}

export function ProductsFilterDialog({
  isOpen,
  category,
  year,
  onCategoryChange,
  onYearChange,
  onReset,
  onClose,
}: ProductsFilterDialogProps) {
  const t = useTranslations('Admin.products.filterDialog');
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4 md:p-4">
      <div className="bg-white border border-[#e0e0e0] w-full max-w-md shadow-lg max-h-[90vh] overflow-y-auto">
        <div className="px-4 sm:px-6 md:px-6 py-3 sm:py-4 md:py-4 border-b border-[#e0e0e0] flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-sm sm:text-base md:text-base font-semibold tracking-[1px] sm:tracking-[1.5px] md:tracking-[2px] uppercase text-[#333]">
            {t('title')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[#666] hover:text-[#333] transition-colors p-1"
            aria-label={t('closeAriaLabel')}
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-4 sm:px-6 md:px-6 py-4 sm:py-5 md:py-5 space-y-3 sm:space-y-4 md:space-y-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-[1px] sm:tracking-[1.5px] md:tracking-[1.5px] text-[#555] mb-1">
              {t('category')}
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="w-full border border-[#e0e0e0] px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[#333]"
              placeholder={t('categoryPlaceholder')}
            />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-[1px] sm:tracking-[1.2px] md:tracking-[1.5px] text-[#555] mb-1">
              {t('year')}
            </label>
            <input
              type="text"
              value={year}
              onChange={(e) => onYearChange(e.target.value)}
              className="w-full border border-[#e0e0e0] px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[#333]"
              placeholder={t('yearPlaceholder')}
            />
          </div>
        </div>
        <div className="px-4 sm:px-6 md:px-6 py-3 sm:py-4 md:py-4 border-t border-[#e0e0e0] flex flex-col sm:flex-row justify-between gap-2 sm:gap-3 md:gap-3 sticky bottom-0 bg-white">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onReset}
            className="w-full sm:w-auto"
          >
            {t('clearFilters')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            {t('close')}
          </Button>
        </div>
      </div>
    </div>
  );
}


