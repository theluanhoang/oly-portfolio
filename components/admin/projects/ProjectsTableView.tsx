'use client';

import { useMemo, useState, useCallback } from 'react';
import { Project } from '@/types/project';
import { AdminTableView, TableColumn, SortDirection } from '@/components/admin/AdminTableView';

interface ProjectsTableViewProps {
  projects: Project[];
  loading: boolean;
  error: string | null;
  totalItems: number;
  currentPage: number;
  totalPages: number;
  startItem: number;
  endItem: number;
  onPageChange: (page: number) => void;
  onDeleteClick: (project: Project) => void;
  onEditClick: (project: Project) => void;
  onOrderUpdate?: () => void;
  sortField?: string | null;
  sortDirection?: SortDirection;
  onSortChange?: (field: string, direction: SortDirection) => void;
}

export function ProjectsTableView({
  projects,
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
  onOrderUpdate,
  sortField,
  sortDirection,
  onSortChange,
}: ProjectsTableViewProps) {
  const [updatingOrders, setUpdatingOrders] = useState<Set<string>>(new Set());

  const handleOrderChange = useCallback(async (project: Project, newOrder: number) => {
    const orderValue = Math.max(0, Math.floor(newOrder));
    if (orderValue === project.displayOrder) return;

    setUpdatingOrders(prev => new Set(prev).add(project.slug));
    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(project.slug)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ displayOrder: orderValue }),
      });

      if (!response.ok) {
        throw new Error('Failed to update order');
      }

      onOrderUpdate?.();
    } catch (error) {
      alert('Failed to update order. Please try again.');
    } finally {
      setUpdatingOrders(prev => {
        const next = new Set(prev);
        next.delete(project.slug);
        return next;
      });
    }
  }, [onOrderUpdate]);

  const columns = useMemo<TableColumn<Project>[]>(() => [
    {
      key: 'displayOrder',
      headerKey: 'order',
      sortable: true,
      sortKey: 'displayOrder',
      render: (project) => (
        <div className="text-center">
          <input
            type="number"
            min="0"
            value={project.displayOrder ?? 0}
            onChange={(e) => {
              const value = parseInt(e.target.value, 10);
              if (!isNaN(value)) {
                handleOrderChange(project, value);
              }
            }}
            onBlur={(e) => {
              const value = parseInt(e.target.value, 10);
              if (!isNaN(value)) {
                handleOrderChange(project, value);
              }
            }}
            disabled={updatingOrders.has(project.slug)}
            className="w-16 px-2 py-1 text-center text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      ),
      className: 'w-20 text-center',
    },
    {
      key: 'title',
      headerKey: 'title',
      sortable: true,
      sortKey: 'title',
      render: (project) => (
        <div className="truncate max-w-[120px] sm:max-w-[150px] md:max-w-none">{project.title}</div>
      ),
      mobileRender: (project) => (
        <>
          <div className="truncate max-w-[120px] sm:max-w-[150px] md:max-w-none">{project.title}</div>
          <div className="text-[10px] text-[#777] mt-0.5">
            {project.category} • {project.location}
          </div>
        </>
      ),
    },
    {
      key: 'category',
      headerKey: 'category',
      sortable: true,
      sortKey: 'category',
      render: (project) => project.category,
      responsive: { hidden: 'sm' },
    },
    {
      key: 'location',
      headerKey: 'location',
      sortable: true,
      sortKey: 'location',
      render: (project) => project.location,
      responsive: { hidden: 'md' },
    },
    {
      key: 'year',
      headerKey: 'year',
      sortable: true,
      sortKey: 'year',
      render: (project) => project.year,
    },
    {
      key: 'heroImage',
      headerKey: 'heroImage',
      render: (project) => (
        <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 border border-[#e0e0e0] bg-[#f8f8f8] overflow-hidden">
          <img
            src={project.heroImage}
            alt={project.title}
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
      render: (project) => new Date(project.createdAt).toLocaleDateString(),
      className: 'text-[#666]',
      responsive: { hidden: 'md' },
    },
  ], [handleOrderChange, updatingOrders]);

  return (
    <AdminTableView
      items={projects}
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
      translationNamespace="Admin.projects.list"
      viewUrlBuilder={(project, locale) => `/${locale}/projects/${project.slug}`}
      getItemIdentifier={(project) => project.title}
      emptyMessageKey="noProjects"
      errorMessageKey="error"
      sortField={sortField}
      sortDirection={sortDirection}
      onSortChange={onSortChange}
    />
  );
}

