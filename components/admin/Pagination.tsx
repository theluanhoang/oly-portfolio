'use client';

import { useTranslations } from 'next-intl';

interface PaginationProps {
  totalItems: number;
  currentPage: number;
  totalPages: number;
  startItem: number;
  endItem: number;
  onPageChange: (page: number) => void;
  variant?: 'table' | 'grid';
}

export function Pagination({
  totalItems,
  currentPage,
  totalPages,
  startItem,
  endItem,
  onPageChange,
  variant = 'table',
}: PaginationProps) {
  const t = useTranslations('Common.pagination');
  
  if (totalItems === 0) return null;

  const containerClasses =
    variant === 'table'
      ? 'flex flex-col sm:flex-row items-stretch sm:items-center md:items-center justify-between gap-2 sm:gap-0 md:gap-0 px-2 sm:px-3 md:px-4 py-2 sm:py-3 md:py-3 border-t border-[#e0e0e0] text-[10px] sm:text-[11px] md:text-xs text-[#666]'
      : 'flex flex-col sm:flex-row items-stretch sm:items-center md:items-center justify-between gap-2 sm:gap-0 md:gap-0 px-1 pt-2 sm:pt-3 md:pt-4 text-[10px] sm:text-[11px] md:text-xs text-[#666]';

  return (
    <div className={containerClasses}>
      <div className="text-center sm:text-left md:text-left">
        {t('showing')}{' '}
        <span className="font-medium">
          {startItem}–{endItem}
        </span>{' '}
        {t('of')} <span className="font-medium">{totalItems}</span> {t('items')}
      </div>
      <div className="flex items-center justify-center sm:justify-end md:justify-end gap-1.5 sm:gap-1.5 md:gap-2">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="px-1.5 sm:px-2 md:px-2 py-1 border border-[#e0e0e0] bg-white text-[#333] text-[10px] sm:text-[11px] md:text-[11px] uppercase tracking-[0.5px] sm:tracking-[0.8px] md:tracking-[1px] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#f5f5f5] transition"
        >
          {t('prev')}
        </button>
        <span className="text-[10px] sm:text-[11px] md:text-[11px] whitespace-nowrap">
          {t('page')} <span className="font-medium">{currentPage}</span> / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="px-1.5 sm:px-2 md:px-2 py-1 border border-[#e0e0e0] bg-white text-[#333] text-[10px] sm:text-[11px] md:text-[11px] uppercase tracking-[0.5px] sm:tracking-[0.8px] md:tracking-[1px] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#f5f5f5] transition"
        >
          {t('next')}
        </button>
      </div>
    </div>
  );
}


