'use client';

import { useMemo } from 'react';
import { Product } from '@/types/product';
import { AdminTableView, TableColumn } from '@/components/admin/AdminTableView';

import { SortDirection } from '@/components/admin/AdminTableView';

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
  sortField?: string | null;
  sortDirection?: SortDirection;
  onSortChange?: (field: string, direction: SortDirection) => void;
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
  sortField,
  sortDirection,
  onSortChange,
}: ProductsTableViewProps) {
  const columns = useMemo<TableColumn<Product>[]>(() => [
    {
      key: 'slug',
      headerKey: 'slug',
      sortable: true,
      sortKey: 'slug',
      render: (product) => (
        <div className="truncate max-w-[120px] sm:max-w-[150px] md:max-w-none">{product.slug}</div>
      ),
      mobileRender: (product) => (
        <>
          <div className="truncate max-w-[120px] sm:max-w-[150px] md:max-w-none">{product.slug}</div>
          <div className="text-[10px] text-[#777] mt-0.5">
            {product.category} • {product.material}
          </div>
        </>
      ),
    },
    {
      key: 'category',
      headerKey: 'category',
      sortable: true,
      sortKey: 'category',
      render: (product) => product.category,
      responsive: { hidden: 'sm' },
    },
    {
      key: 'material',
      headerKey: 'material',
      sortable: true,
      sortKey: 'material',
      render: (product) => product.material,
      responsive: { hidden: 'md' },
    },
    {
      key: 'year',
      headerKey: 'year',
      sortable: true,
      sortKey: 'year',
      render: (product) => product.year,
    },
    {
      key: 'thumbnail',
      headerKey: 'thumbnail',
      render: (product) => (
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
      ),
      responsive: { hidden: 'lg' },
    },
    {
      key: 'created',
      headerKey: 'created',
      sortable: true,
      sortKey: 'createdAt',
      render: (product) => {
        const date = new Date(product.createdAt);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      },
      className: 'text-[#666]',
      responsive: { hidden: 'md' },
    },
  ], []);

  return (
    <AdminTableView
      items={products}
      loading={loading}
      error={error}
      totalItems={totalItems}
      currentPage={currentPage}
      totalPages={totalPages}
      startItem={startItem}
      endItem={endItem}
      onPageChange={onPageChange}
      onDeleteClick={onDeleteClick}
      onEditClick={onEditClick}
      columns={columns}
      translationNamespace="Admin.products"
      viewUrlBuilder={(product, locale) => `/${locale}/products/${product.slug}`}
      getItemIdentifier={(product) => product.slug}
      emptyMessageKey="noProducts"
      errorMessageKey="error"
      sortField={sortField}
      sortDirection={sortDirection}
      onSortChange={onSortChange}
    />
  );
}


