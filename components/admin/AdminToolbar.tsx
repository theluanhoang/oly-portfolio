'use client';

import { Filter, LayoutGrid, List, Plus, RefreshCw, Search, ArrowUpDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Button from '@/components/ui/Button';

interface AdminToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  viewMode: 'table' | 'grid' | 'order';
  onViewModeChange: (mode: 'table' | 'grid' | 'order') => void;
  loading: boolean;
  onReload: () => void;
  onAdd: () => void;
  onOpenFilter: () => void;
  translationNamespace: string;
  addButtonKey?: string;
  showOrderView?: boolean;
}

export function AdminToolbar({
  search,
  onSearchChange,
  viewMode,
  onViewModeChange,
  loading,
  onReload,
  onAdd,
  onOpenFilter,
  translationNamespace,
  addButtonKey = 'addProduct',
  showOrderView = true,
}: AdminToolbarProps) {
  const t = useTranslations(translationNamespace);
  
  return (
    <div className="w-full">
      {/* Header Section */}
      <div className="flex flex-col space-y-1">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-[2px] uppercase text-[#333]">
          {t('title')}
        </h1>
        <p className="text-xs sm:text-sm text-[#666]">
          {t('subtitle')}
        </p>
      </div>

      {/* Toolbar Actions */}
      <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between mt-4 md:mt-6">
        {/* Search and Filter Group */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-2.5 flex-1 lg:flex-initial">
          {/* Search Input */}
          <div className="relative flex-1 sm:flex-initial sm:min-w-[200px] lg:min-w-[240px]">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <Search size={16} className="text-[#999]" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full h-10 pl-10 pr-4 text-sm bg-white border border-[#e0e0e0] rounded-md 
                         focus:outline-none focus:ring-2 focus:ring-[#333] focus:border-transparent
                         transition-all placeholder:text-[#999]"
            />
          </div>

          {/* Filter Button */}
          <button
            type="button"
            onClick={onOpenFilter}
            className="h-10 px-4 flex items-center justify-center gap-2 text-xs font-medium tracking-[1px] uppercase
                       bg-white border border-[#e0e0e0] rounded-md
                       hover:bg-[#f5f5f5] transition-colors
                       whitespace-nowrap"
          >
            <Filter size={16} />
            <span className="hidden sm:inline">{t('filter')}</span>
          </button>
        </div>

        {/* View Mode and Actions Group */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-2.5 items-stretch sm:items-center">
          {/* View Mode Toggle */}
          <div className="inline-flex h-10 rounded-md border border-[#e0e0e0] bg-white overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={() => onViewModeChange('table')}
              className={`h-full px-3 sm:px-4 flex items-center justify-center gap-1.5 text-xs font-medium tracking-[1px] uppercase
                         transition-colors ${
                viewMode === 'table'
                  ? 'bg-[#333] text-white'
                  : 'text-[#555] hover:bg-[#f5f5f5]'
              }`}
            >
              <List size={16} />
              <span className="hidden sm:inline">{t('tableView')}</span>
            </button>
            <div className="w-px bg-[#e0e0e0]" />
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              className={`h-full px-3 sm:px-4 flex items-center justify-center gap-1.5 text-xs font-medium tracking-[1px] uppercase
                         transition-colors ${
                viewMode === 'grid'
                  ? 'bg-[#333] text-white'
                  : 'text-[#555] hover:bg-[#f5f5f5]'
              }`}
            >
              <LayoutGrid size={16} />
              <span className="hidden sm:inline">{t('grid')}</span>
            </button>
            {showOrderView && (
              <>
                <div className="w-px bg-[#e0e0e0]" />
                <button
                  type="button"
                  onClick={() => onViewModeChange('order')}
                  className={`h-full px-3 sm:px-4 flex items-center justify-center gap-1.5 text-xs font-medium tracking-[1px] uppercase
                             transition-colors ${
                    viewMode === 'order'
                      ? 'bg-[#333] text-white'
                      : 'text-[#555] hover:bg-[#f5f5f5]'
                  }`}
                >
                  <ArrowUpDown size={16} />
                  <span className="hidden sm:inline">{t('orderView') || 'Sắp xếp'}</span>
                </button>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 sm:gap-2.5">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onReload}
              disabled={loading}
              className="h-10! py-0! flex items-center justify-center gap-2 flex-1 sm:flex-initial min-w-[80px] sm:min-w-0"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">{t('reload')}</span>
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-10! py-0! flex items-center justify-center gap-2 flex-1 sm:flex-initial min-w-[80px] sm:min-w-0"
              onClick={onAdd}
            >
              <Plus size={16} />
              <span className="hidden sm:inline">{t(addButtonKey)}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

