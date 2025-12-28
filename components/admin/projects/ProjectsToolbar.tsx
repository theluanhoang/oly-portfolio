'use client';

import { AdminToolbar } from '@/components/admin/AdminToolbar';

interface ProjectsToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  viewMode: 'table' | 'grid' | 'order';
  onViewModeChange: (mode: 'table' | 'grid' | 'order') => void;
  loading: boolean;
  onReload: () => void;
  onAdd: () => void;
  onOpenFilter: () => void;
}

export function ProjectsToolbar(props: ProjectsToolbarProps) {
  return (
    <AdminToolbar
      {...props}
      translationNamespace="Admin.projects.list"
      addButtonKey="addProject"
    />
  );
}

