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
    <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-xl sm:text-2xl md:text-2xl font-semibold tracking-[1px] sm:tracking-[2px] uppercase text-[#333]">{t('title')}</h1>
        <p className="text-xs sm:text-sm md:text-sm text-[#666] mt-1">{t('subtitle')}</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-3 items-stretch sm:items-center md:justify-end">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-2 bg-white border border-[#e0e0e0] rounded-full px-2 sm:px-3 md:px-3 py-1 shadow-sm focus-within:ring-1 focus-within:ring-[#333] flex-1 sm:flex-initial md:flex-initial min-w-0 sm:min-w-[140px] md:min-w-[180px]">
            <Search size={14} className="text-[#999] flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="text-xs px-1 py-1 outline-none bg-transparent w-full"
            />
          </div>
          <button
            type="button"
            onClick={onOpenFilter}
            className="flex items-center gap-1 text-xs px-2 sm:px-3 md:px-3 py-1 border border-[#e0e0e0] bg-white hover:bg-[#f5f5f5] uppercase tracking-[1px] whitespace-nowrap"
          >
            <Filter size={14} />
            <span className="hidden md:inline">{t('filter')}</span>
          </button>
        </div>
        <div className="inline-flex rounded-sm border border-[#e0e0e0] bg-white overflow-hidden self-start sm:self-auto md:self-auto">
          <button
            type="button"
            onClick={() => onViewModeChange('table')}
            className={`px-2 sm:px-3 md:px-3 py-1.5 text-xs tracking-[1px] uppercase flex items-center gap-1 ${
              viewMode === 'table'
                ? 'bg-[#333] text-white'
                : 'text-[#555] hover:bg-[#f5f5f5]'
            }`}
          >
            <List size={14} />
            <span className="hidden md:inline">{t('tableView')}</span>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('grid')}
            className={`px-2 sm:px-3 md:px-3 py-1.5 text-xs tracking-[1px] uppercase border-l border-[#e0e0e0] flex items-center gap-1 ${
              viewMode === 'grid'
                ? 'bg-[#333] text-white'
                : 'text-[#555] hover:bg-[#f5f5f5]'
            }`}
          >
            <LayoutGrid size={14} />
            <span className="hidden md:inline">{t('grid')}</span>
          </button>
          {showOrderView && (
            <button
              type="button"
              onClick={() => onViewModeChange('order')}
              className={`px-2 sm:px-3 md:px-3 py-1.5 text-xs tracking-[1px] uppercase border-l border-[#e0e0e0] flex items-center gap-1 ${
                viewMode === 'order'
                  ? 'bg-[#333] text-white'
                  : 'text-[#555] hover:bg-[#f5f5f5]'
              }`}
            >
              <ArrowUpDown size={14} />
              <span className="hidden md:inline">{t('orderView') || 'Sắp xếp'}</span>
            </button>
          )}
        </div>
        <div className="flex gap-2 sm:gap-2 md:gap-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onReload}
            disabled={loading}
            className="flex items-center gap-1 sm:gap-1 md:gap-2 flex-1 sm:flex-initial md:flex-initial"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span className="hidden md:inline">{t('reload')}</span>
          </Button>
          <Button
            type="button"
            size="sm"
            className="flex items-center gap-1 sm:gap-1 md:gap-2 flex-1 sm:flex-initial md:flex-initial"
            onClick={onAdd}
          >
            <Plus size={16} />
            <span className="hidden md:inline">{t(addButtonKey)}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

