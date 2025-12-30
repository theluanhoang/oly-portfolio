'use client';

import { AdminToolbar } from '@/components/admin/AdminToolbar';

interface ProductsToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  viewMode: 'table' | 'grid';
  onViewModeChange: (mode: 'table' | 'grid') => void;
  loading: boolean;
  onReload: () => void;
  onAdd: () => void;
  onOpenFilter: () => void;
}

export function ProductsToolbar(props: ProductsToolbarProps) {
  return (
    <AdminToolbar
      {...props}
      translationNamespace="Admin.products"
      addButtonKey="addProduct"
      showOrderView={false}
    />
  );
}


