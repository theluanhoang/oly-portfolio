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
  const { onViewModeChange, ...restProps } = props;
  
  const handleViewModeChange = (mode: 'table' | 'grid' | 'order') => {
    if (mode !== 'order') {
      onViewModeChange(mode);
    }
  };

  return (
    <AdminToolbar
      {...restProps}
      viewMode={props.viewMode}
      onViewModeChange={handleViewModeChange}
      translationNamespace="Admin.products"
      addButtonKey="addProduct"
      showOrderView={false}
    />
  );
}


