'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from '@/i18n/routing';
import { ProductsToolbar } from '@/components/admin/products/ProductsToolbar';
import { ProductsTableView } from '@/components/admin/products/ProductsTableView';
import { ProductsGridView } from '@/components/admin/products/ProductsGridView';
import { DeleteProductDialog } from '@/components/admin/products/DeleteProductDialog';
import { ProductsFilterDialog } from '@/components/admin/products/ProductsFilterDialog';
import type { Product } from '@/types/product';
import type { SortDirection } from '@/components/admin/AdminTableView';

interface ProductsResponse {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
}

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const tablePageSize = 10;
  const gridPageSize = 6;
  const pageSize = viewMode === 'table' ? tablePageSize : gridPageSize;
  const [totalItems, setTotalItems] = useState(0);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.set('page', String(currentPage));
      params.set('pageSize', String(pageSize));
      const trimmed = searchQuery.trim();
      if (trimmed.length > 0) {
        params.set('q', trimmed.toLowerCase());
      }
      const categoryTrimmed = categoryFilter.trim();
      if (categoryTrimmed.length > 0) {
        params.set('category', categoryTrimmed);
      }
      const yearTrimmed = yearFilter.trim();
      if (yearTrimmed.length > 0) {
        params.set('year', yearTrimmed);
      }
      if (sortField && sortDirection) {
        params.set('sortField', sortField);
        params.set('sortDirection', sortDirection);
      }
      const res = await fetch(`/api/products?${params.toString()}`, {
        cache: 'no-store',
      });
      if (!res.ok) {
        throw new Error('Failed to fetch products');
      }
      const data = (await res.json()) as ProductsResponse;
      setProducts(data.items);
      setTotalItems(data.total);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchQuery, categoryFilter, yearFilter, sortField, sortDirection]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
  };

  const handleCancelDelete = () => {
    if (isDeleting) return;
    setProductToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/products/${encodeURIComponent(productToDelete.slug)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        throw new Error('Failed to delete product');
      }
      await loadProducts();
      setProductToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const totalPages = Math.max(Math.ceil(totalItems / pageSize), 1);
  const safePage = Math.min(currentPage, totalPages);
  const startItem = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endItem = totalItems === 0 ? 0 : startItem + products.length - 1;

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      setCurrentPage(1);
      setSearchQuery(search);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, yearFilter]);

  const handleSortChange = (field: string, direction: SortDirection) => {
    setSortField(direction ? field : null);
    setSortDirection(direction);
    setCurrentPage(1);
  };

  return (
    <div className="bg-background text-foreground">
      <div className="space-y-4 sm:space-y-5 md:space-y-6 mt-4 sm:mt-6 md:mt-8 lg:mt-12 xl:mt-16 mb-4 sm:mb-6 md:mb-8 lg:mb-12 xl:mb-16">
        <ProductsToolbar
          search={search}
          onSearchChange={setSearch}
          viewMode={viewMode}
          onViewModeChange={(mode) => {
            setViewMode(mode);
            setCurrentPage(1);
          }}
          loading={loading}
          onReload={loadProducts}
          onAdd={() => router.push('/admin/products/new')}
          onOpenFilter={() => setIsFilterOpen(true)}
        />

        {viewMode === 'table' ? (
          <ProductsTableView
            products={products}
            loading={loading}
            error={error}
            totalItems={totalItems}
            currentPage={currentPage}
            totalPages={totalPages}
            startItem={startItem}
            endItem={endItem}
            onPageChange={handlePageChange}
            onDeleteClick={handleDeleteClick}
            onEditClick={(product) => alert(`Edit product: ${product.slug}`)}
            sortField={sortField}
            sortDirection={sortDirection}
            onSortChange={handleSortChange}
          />
        ) : (
          <ProductsGridView
            products={products}
            loading={loading}
            error={error}
            totalItems={totalItems}
            currentPage={currentPage}
            totalPages={totalPages}
            startItem={startItem}
            endItem={endItem}
            onPageChange={handlePageChange}
            onDeleteClick={handleDeleteClick}
            onEditClick={(product) => alert(`Edit product: ${product.slug}`)}
          />
        )}
      </div>
      <DeleteProductDialog
        product={productToDelete}
        isDeleting={isDeleting}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />
      <ProductsFilterDialog
        isOpen={isFilterOpen}
        category={categoryFilter}
        year={yearFilter}
        onCategoryChange={setCategoryFilter}
        onYearChange={setYearFilter}
        onReset={() => {
          setCategoryFilter('');
          setYearFilter('');
        }}
        onClose={() => setIsFilterOpen(false)}
      />
    </div>
  );
}

