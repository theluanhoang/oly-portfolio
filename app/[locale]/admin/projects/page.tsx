'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from '@/i18n/routing';
import { ProjectsToolbar } from '@/components/admin/projects/ProjectsToolbar';
import { ProjectsTableView } from '@/components/admin/projects/ProjectsTableView';
import { ProjectsGridView } from '@/components/admin/projects/ProjectsGridView';
import { DeleteProjectDialog } from '@/components/admin/projects/DeleteProjectDialog';
import { ProjectsFilterDialog } from '@/components/admin/projects/ProjectsFilterDialog';
import type { Project } from '@/types/project';
import type { SortDirection } from '@/components/admin/AdminTableView';

interface ProjectsResponse {
  items: Project[];
  total: number;
  page: number;
  pageSize: number;
}

export default function AdminProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const tablePageSize = 10;
  const gridPageSize = 6;
  const pageSize = viewMode === 'table' ? tablePageSize : gridPageSize;
  const [totalItems, setTotalItems] = useState(0);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const loadProjects = useCallback(async () => {
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
      const locationTrimmed = locationFilter.trim();
      if (locationTrimmed.length > 0) {
        params.set('location', locationTrimmed);
      }
      if (sortField && sortDirection) {
        params.set('sortField', sortField);
        params.set('sortDirection', sortDirection);
      }
      const res = await fetch(`/api/projects?${params.toString()}`, {
        cache: 'no-store',
      });
      if (!res.ok) {
        throw new Error('Failed to fetch projects');
      }
      const data = (await res.json()) as ProjectsResponse;
      setProjects(data.items);
      setTotalItems(data.total);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchQuery, categoryFilter, yearFilter, locationFilter, sortField, sortDirection]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleDeleteClick = (project: Project) => {
    setProjectToDelete(project);
  };

  const handleCancelDelete = () => {
    if (isDeleting) return;
    setProjectToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/projects/${encodeURIComponent(projectToDelete.slug)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        throw new Error('Failed to delete project');
      }
      await loadProjects();
      setProjectToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditClick = (project: Project) => {
    router.push(`/admin/projects/${project.slug}/edit`);
  };

  const totalPages = Math.max(Math.ceil(totalItems / pageSize), 1);
  const safePage = Math.min(currentPage, totalPages);
  const startItem = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endItem = totalItems === 0 ? 0 : startItem + projects.length - 1;

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
  }, [categoryFilter, yearFilter, locationFilter]);

  const handleSortChange = (field: string, direction: SortDirection) => {
    setSortField(direction ? field : null);
    setSortDirection(direction);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-background text-foreground pt-4 sm:pt-6 md:pt-10 pb-8 sm:pb-12 md:pb-16 px-3 sm:px-4 md:px-6">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-5 md:space-y-6">
        <ProjectsToolbar
          search={search}
          onSearchChange={setSearch}
          viewMode={viewMode}
          onViewModeChange={(mode) => {
            setViewMode(mode);
            setCurrentPage(1);
          }}
          loading={loading}
          onReload={loadProjects}
          onAdd={() => router.push('/admin/projects/new')}
          onOpenFilter={() => setIsFilterOpen(true)}
        />

        {viewMode === 'table' ? (
          <ProjectsTableView
            projects={projects}
            loading={loading}
            error={error}
            totalItems={totalItems}
            currentPage={currentPage}
            totalPages={totalPages}
            startItem={startItem}
            endItem={endItem}
            onPageChange={handlePageChange}
            onDeleteClick={handleDeleteClick}
            onEditClick={handleEditClick}
            sortField={sortField}
            sortDirection={sortDirection}
            onSortChange={handleSortChange}
          />
        ) : (
          <ProjectsGridView
            projects={projects}
            loading={loading}
            error={error}
            totalItems={totalItems}
            currentPage={currentPage}
            totalPages={totalPages}
            startItem={startItem}
            endItem={endItem}
            onPageChange={handlePageChange}
            onDeleteClick={handleDeleteClick}
            onEditClick={handleEditClick}
          />
        )}
      </div>
      <DeleteProjectDialog
        project={projectToDelete}
        isDeleting={isDeleting}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />
      <ProjectsFilterDialog
        isOpen={isFilterOpen}
        category={categoryFilter}
        year={yearFilter}
        location={locationFilter}
        onCategoryChange={setCategoryFilter}
        onYearChange={setYearFilter}
        onLocationChange={setLocationFilter}
        onReset={() => {
          setCategoryFilter('');
          setYearFilter('');
          setLocationFilter('');
        }}
        onClose={() => setIsFilterOpen(false)}
      />
    </div>
  );
}

