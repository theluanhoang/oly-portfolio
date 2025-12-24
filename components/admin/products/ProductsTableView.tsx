'use client';

import { Eye, Pencil, Trash2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Product } from '@/types/product';
import { Pagination } from '@/components/admin/Pagination';

interface ProductsTableViewProps {
  products: Product[];
  loading: boolean;
  error: string | null;
  totalItems: number;
  currentPage: number;
  totalPages: number;
  startItem: number;
  endItem: number;
  onPageChange: (page: number) => void;
  onDeleteClick: (product: Product) => void;
  onEditClick: (product: Product) => void;
}

export function ProductsTableView({
  products,
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
}: ProductsTableViewProps) {
  const locale = useLocale();
  const t = useTranslations('Admin.products');
  const tActions = useTranslations('Admin.products.actions');
  const tTable = useTranslations('Admin.products.table');

  const handleView = (product: Product) => {
    const url = `/${locale}/products/${product.slug}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bg-white border border-[#e0e0e0] h-[400px] sm:h-[500px] md:h-[550px] lg:h-[600px] flex flex-col">
      <div className="overflow-x-auto overflow-y-auto flex-1">
        <table className="min-w-full divide-y divide-[#eaeaea]">
          <thead className="bg-[#f9f9f9] sticky top-0 z-10">
            <tr>
              <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-left text-[10px] sm:text-[11px] md:text-xs font-semibold uppercase tracking-[1px] sm:tracking-[1.5px] md:tracking-[2px] text-[#555]">{tTable('headers.slug')}</th>
              <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-left text-[10px] sm:text-[11px] md:text-xs font-semibold uppercase tracking-[1px] sm:tracking-[1.5px] md:tracking-[2px] text-[#555] hidden sm:table-cell">{tTable('headers.category')}</th>
              <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-left text-[10px] sm:text-[11px] md:text-xs font-semibold uppercase tracking-[1px] sm:tracking-[1.5px] md:tracking-[2px] text-[#555] hidden md:table-cell">{tTable('headers.material')}</th>
              <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-left text-[10px] sm:text-[11px] md:text-xs font-semibold uppercase tracking-[1px] sm:tracking-[1.5px] md:tracking-[2px] text-[#555]">{tTable('headers.year')}</th>
              <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-left text-[10px] sm:text-[11px] md:text-xs font-semibold uppercase tracking-[1px] sm:tracking-[1.5px] md:tracking-[2px] text-[#555] hidden lg:table-cell">{tTable('headers.thumbnail')}</th>
              <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-left text-[10px] sm:text-[11px] md:text-xs font-semibold uppercase tracking-[1px] sm:tracking-[1.5px] md:tracking-[2px] text-[#555] hidden md:table-cell">{tTable('headers.created')}</th>
              <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-left text-[10px] sm:text-[11px] md:text-xs font-semibold uppercase tracking-[1px] sm:tracking-[1.5px] md:tracking-[2px] text-[#555]">{tTable('headers.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f0f0]">
            {loading && (
              <tr>
                <td colSpan={7} className="px-2 sm:px-4 py-5 text-center text-xs sm:text-sm text-[#666]">
                  {tTable('loading')}
                </td>
              </tr>
            )}
            {!loading && error && (
              <tr>
                <td colSpan={7} className="px-2 sm:px-4 py-5 text-center text-xs sm:text-sm text-red-600">
                  {t('error')}
                </td>
              </tr>
            )}
            {!loading && !error && products.length === 0 && (
              <tr>
                <td colSpan={7} className="px-2 sm:px-4 py-5 text-center text-xs sm:text-sm text-[#666]">
                  {tTable('noProducts')}
                </td>
              </tr>
            )}
            {!loading &&
              !error &&
              products.map((product) => (
                <tr key={product.id} className="hover:bg-[#fafafa]">
                  <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-[11px] sm:text-xs md:text-sm text-[#333]">
                    <div className="truncate max-w-[120px] sm:max-w-[150px] md:max-w-none">{product.slug}</div>
                    <div className="sm:hidden text-[10px] text-[#777] mt-0.5">
                      {product.category} • {product.material}
                    </div>
                  </td>
                  <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-[11px] sm:text-xs md:text-sm text-[#333] hidden sm:table-cell">{product.category}</td>
                  <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-[11px] sm:text-xs md:text-sm text-[#333] hidden md:table-cell">{product.material}</td>
                  <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-[11px] sm:text-xs md:text-sm text-[#333]">{product.year}</td>
                  <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 hidden lg:table-cell">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 border border-[#e0e0e0] bg-[#f8f8f8] overflow-hidden">
                      <img
                        src={product.thumbnail}
                        alt={product.slug}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src =
                            'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="128" height="128"%3E%3Crect fill="%23f0f0f0" width="128" height="128"/%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-size="10"%3ENo Image%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    </div>
                  </td>
                  <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-[11px] sm:text-xs md:text-sm text-[#666] hidden md:table-cell">
                    {new Date(product.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-[11px] sm:text-xs md:text-sm text-[#333]">
                    <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2">
                      <button
                        type="button"
                        onClick={() => handleView(product)}
                        className="h-7 w-7 sm:h-7 sm:w-7 md:h-8 md:w-8 flex items-center justify-center rounded-full border border-[#e0e0e0] bg-white text-[#333] hover:bg-[#f5f5f5] transition"
                        aria-label={`${tActions('view')} ${product.slug}`}
                        title={tActions('view')}
                      >
                        <Eye size={13} className="sm:w-[14px] sm:h-[14px] md:w-4 md:h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEditClick(product)}
                        className="h-7 w-7 sm:h-7 sm:w-7 md:h-8 md:w-8 flex items-center justify-center rounded-full border border-[#e0e0e0] bg-white text-[#333] hover:bg-[#f5f5f5] transition"
                        aria-label={`${tActions('edit')} ${product.slug}`}
                        title={tActions('edit')}
                      >
                        <Pencil size={13} className="sm:w-[14px] sm:h-[14px] md:w-4 md:h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteClick(product)}
                        className="h-7 w-7 sm:h-7 sm:w-7 md:h-8 md:w-8 flex items-center justify-center rounded-full border border-red-200 bg-white text-red-600 hover:bg-red-50 transition"
                        aria-label={`${tActions('delete')} ${product.slug}`}
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


