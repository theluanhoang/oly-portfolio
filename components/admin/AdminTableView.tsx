'use client';

import { ArrowDown, ArrowUp, Eye, Pencil, Trash2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Pagination } from '@/components/admin/Pagination';

export type SortDirection = 'asc' | 'desc' | null;

export interface TableColumn<T> {
  key: string;
  headerKey: string;
  render: (item: T) => React.ReactNode;
  mobileRender?: (item: T) => React.ReactNode;
  className?: string;
  responsive?: {
    hidden?: 'sm' | 'md' | 'lg';
  };
  sortable?: boolean;
  sortKey?: string;
}

interface AdminTableViewProps<T extends { id: string; createdAt: string }> {
  items: T[];
  loading: boolean;
  error: string | null;
  totalItems: number;
  currentPage: number;
  totalPages: number;
  startItem: number;
  endItem: number;
  onPageChange: (page: number) => void;
  onDeleteClick: (item: T) => void;
  onEditClick: (item: T) => void;
  columns: TableColumn<T>[];
  translationNamespace: string;
  viewUrlBuilder: (item: T, locale: string) => string;
  getItemIdentifier: (item: T) => string;
  emptyMessageKey: string;
  errorMessageKey: string;
  sortField?: string | null;
  sortDirection?: SortDirection;
  onSortChange?: (field: string, direction: SortDirection) => void;
}

export function AdminTableView<T extends { id: string; createdAt: string }>({
  items,
  loading,
  error,
  totalItems,
  currentPage,
  totalPages,
  startItem,
  endItem,
  onPageChange,
  onDeleteClick,
  onEditClick,
  columns,
  translationNamespace,
  viewUrlBuilder,
  getItemIdentifier,
  emptyMessageKey,
  errorMessageKey,
  sortField,
  sortDirection,
  onSortChange,
}: AdminTableViewProps<T>) {
  const locale = useLocale();
  const t = useTranslations(translationNamespace);
  const tActions = useTranslations(`${translationNamespace}.actions`);
  const tTable = useTranslations(`${translationNamespace}.table`);

  const handleView = (item: T) => {
    const url = viewUrlBuilder(item, locale);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSort = (column: TableColumn<T>) => {
    if (!column.sortable || !onSortChange || !column.sortKey) return;
    
    const field = column.sortKey;
    let newDirection: SortDirection = 'asc';
    
    if (sortField === field) {
      if (sortDirection === 'asc') {
        newDirection = 'desc';
      } else if (sortDirection === 'desc') {
        newDirection = null;
      }
    }
    
    onSortChange(field, newDirection);
  };

  const totalColumns = columns.length + 1;

  return (
    <div className="bg-white border border-[#e0e0e0] h-[400px] sm:h-[500px] md:h-[550px] lg:h-[600px] flex flex-col">
      <div className="overflow-x-auto overflow-y-auto flex-1">
        <table className="min-w-full divide-y divide-[#eaeaea]">
          <thead className="bg-[#f9f9f9] sticky top-0 z-10">
            <tr>
              {columns.map((column) => {
                const isSortable = column.sortable && column.sortKey && onSortChange;
                const isActive = sortField === column.sortKey;
                const showAsc = isActive && sortDirection === 'asc';
                const showDesc = isActive && sortDirection === 'desc';
                
                return (
                  <th
                    key={column.key}
                    onClick={() => isSortable && handleSort(column)}
                    className={`px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-left text-[10px] sm:text-[11px] md:text-xs font-semibold uppercase tracking-[1px] sm:tracking-[1.5px] md:tracking-[2px] text-[#555] ${
                      column.responsive?.hidden === 'sm' ? 'hidden sm:table-cell' : ''
                    } ${
                      column.responsive?.hidden === 'md' ? 'hidden md:table-cell' : ''
                    } ${
                      column.responsive?.hidden === 'lg' ? 'hidden lg:table-cell' : ''
                    } ${column.className || ''} ${
                      isSortable ? 'cursor-pointer hover:bg-[#f0f0f0] select-none' : ''
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{tTable(`headers.${column.headerKey}`)}</span>
                      {isSortable && (
                        <div className="flex flex-col items-center justify-center">
                          <ArrowUp
                            size={12}
                            className={`transition-opacity ${
                              showAsc ? 'opacity-100 text-[#333]' : 'opacity-30'
                            }`}
                          />
                          <ArrowDown
                            size={12}
                            className={`transition-opacity -mt-1 ${
                              showDesc ? 'opacity-100 text-[#333]' : 'opacity-30'
                            }`}
                          />
                        </div>
                      )}
                    </div>
                  </th>
                );
              })}
              <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-left text-[10px] sm:text-[11px] md:text-xs font-semibold uppercase tracking-[1px] sm:tracking-[1.5px] md:tracking-[2px] text-[#555]">
                {tTable('headers.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f0f0]">
            {loading && (
              <tr>
                <td colSpan={totalColumns} className="px-2 sm:px-4 py-5 text-center text-xs sm:text-sm text-[#666]">
                  {tTable('loading')}
                </td>
              </tr>
            )}
            {!loading && error && (
              <tr>
                <td colSpan={totalColumns} className="px-2 sm:px-4 py-5 text-center text-xs sm:text-sm text-red-600">
                  {t(errorMessageKey)}
                </td>
              </tr>
            )}
            {!loading && !error && items.length === 0 && (
              <tr>
                <td colSpan={totalColumns} className="px-2 sm:px-4 py-5 text-center text-xs sm:text-sm text-[#666]">
                  {tTable(emptyMessageKey)}
                </td>
              </tr>
            )}
            {!loading &&
              !error &&
              items.map((item) => (
                <tr key={item.id} className="hover:bg-[#fafafa]">
                  {columns.map((column) => {
                    const isHiddenOnMobile = column.responsive?.hidden === 'sm';
                    const hasMobileRender = !!column.mobileRender && !isHiddenOnMobile;
                    
                    return (
                      <td
                        key={column.key}
                        className={`px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-[11px] sm:text-xs md:text-sm text-[#333] ${
                          column.responsive?.hidden === 'sm' ? 'hidden sm:table-cell' : ''
                        } ${
                          column.responsive?.hidden === 'md' ? 'hidden md:table-cell' : ''
                        } ${
                          column.responsive?.hidden === 'lg' ? 'hidden lg:table-cell' : ''
                        } ${column.className || ''}`}
                      >
                        {hasMobileRender && (
                          <div className="sm:hidden">
                            {column.mobileRender!(item)}
                          </div>
                        )}
                        <div className={hasMobileRender ? 'hidden sm:block' : ''}>
                          {column.render(item)}
                        </div>
                      </td>
                    );
                  })}
                  <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-[11px] sm:text-xs md:text-sm text-[#333]">
                    <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2">
                      <button
                        type="button"
                        onClick={() => handleView(item)}
                        className="h-7 w-7 sm:h-7 sm:w-7 md:h-8 md:w-8 flex items-center justify-center rounded-full border border-[#e0e0e0] bg-white text-[#333] hover:bg-[#f5f5f5] transition"
                        aria-label={`${tActions('view')} ${getItemIdentifier(item)}`}
                        title={tActions('view')}
                      >
                        <Eye size={13} className="sm:w-[14px] sm:h-[14px] md:w-4 md:h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEditClick(item)}
                        className="h-7 w-7 sm:h-7 sm:w-7 md:h-8 md:w-8 flex items-center justify-center rounded-full border border-[#e0e0e0] bg-white text-[#333] hover:bg-[#f5f5f5] transition"
                        aria-label={`${tActions('edit')} ${getItemIdentifier(item)}`}
                        title={tActions('edit')}
                      >
                        <Pencil size={13} className="sm:w-[14px] sm:h-[14px] md:w-4 md:h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteClick(item)}
                        className="h-7 w-7 sm:h-7 sm:w-7 md:h-8 md:w-8 flex items-center justify-center rounded-full border border-red-200 bg-white text-red-600 hover:bg-red-50 transition"
                        aria-label={`${tActions('delete')} ${getItemIdentifier(item)}`}
                        title={tActions('delete')}
                      >
                        <Trash2 size={13} className="sm:w-[14px] sm:h-[14px] md:w-4 md:h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <Pagination
        totalItems={totalItems}
        currentPage={currentPage}
        totalPages={totalPages}
        startItem={startItem}
        endItem={endItem}
        onPageChange={onPageChange}
        variant="table"
      />
    </div>
  );
}

