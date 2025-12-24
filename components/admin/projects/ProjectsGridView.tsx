'use client';

import { Eye, Pencil, Trash2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Project } from '@/types/project';
import { Pagination } from '@/components/admin/Pagination';

interface ProjectsGridViewProps {
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
}

export function ProjectsGridView({
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
}: ProjectsGridViewProps) {
  const locale = useLocale();
  const t = useTranslations('Admin.projects.list');
  const tTable = useTranslations('Admin.projects.list.table');
  const tActions = useTranslations('Admin.projects.list.actions');

  const handleView = (project: Project) => {
    const url = `/${locale}/projects/${project.slug}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bg-white border border-[#e0e0e0] p-2 sm:p-3 md:p-4 min-h-[400px] sm:min-h-[500px] md:min-h-[550px] lg:min-h-[600px] flex flex-col">
      {loading && (
        <div className="py-8 text-center text-xs sm:text-sm md:text-sm text-[#666]">{tTable('loading')}</div>
      )}
      {!loading && error && (
        <div className="py-8 text-center text-xs sm:text-sm md:text-sm text-red-600">{t('error')}</div>
      )}
      {!loading && !error && totalItems === 0 && (
        <div className="py-8 text-center text-xs sm:text-sm md:text-sm text-[#666]">
          {tTable('noProjects')}
        </div>
      )}
      {!loading && !error && totalItems > 0 && (
        <div className="grid gap-2 sm:gap-3 md:gap-3 lg:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 flex-1">
          {projects.map((project) => (
            <div
              key={project.id}
              className="border border-[#e0e0e0] bg-white hover:bg-[#fafafa] transition shadow-[0_1px_2px_rgba(0,0,0,0.04)] h-64 sm:h-72 md:h-72 flex flex-col"
            >
              <div className="w-full h-32 sm:h-40 md:h-40 border-b border-[#e0e0e0] bg-[#f8f8f8] overflow-hidden">
                <img
                  src={project.heroImage}
                  alt={project.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src =
                      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="256" height="160"%3E%3Crect fill="%23f0f0f0" width="256" height="160"/%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-size="12"%3ENo Image%3C/text%3E%3C/svg%3E';
                  }}
                />
              </div>
              <div className="p-2 sm:p-3 md:p-3 space-y-1 flex-1">
                <div className="text-[10px] sm:text-[11px] md:text-xs uppercase tracking-[1px] sm:tracking-[1.2px] md:tracking-[1.5px] text-[#777]">
                  {project.category} • {project.year}
                </div>
                <div className="text-[11px] sm:text-xs md:text-sm font-medium text-[#333] truncate">
                  {project.title}
                </div>
                <div className="text-[10px] sm:text-[11px] md:text-xs text-[#777] truncate">
                  {project.location}
                </div>
              </div>
              <div className="px-2 sm:px-3 md:px-3 py-1.5 sm:py-2 md:py-2 border-t border-[#e0e0e0] flex items-center justify-between">
                <div className="text-[10px] sm:text-[10px] md:text-[11px] text-[#999]">
                  {new Date(project.createdAt).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-0.5 sm:gap-0.5 md:gap-1">
                  <button
                    type="button"
                    onClick={() => handleView(project)}
                    className="h-7 w-7 sm:h-7 sm:w-7 md:h-8 md:w-8 flex items-center justify-center rounded-full border border-[#e0e0e0] bg-white text-[#333] hover:bg-[#f5f5f5] transition"
                    aria-label={`${tActions('view')} ${project.title}`}
                    title={tActions('view')}
                  >
                    <Eye size={13} className="sm:w-[14px] sm:h-[14px] md:w-4 md:h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onEditClick(project)}
                    className="h-7 w-7 sm:h-7 sm:w-7 md:h-8 md:w-8 flex items-center justify-center rounded-full border border-[#e0e0e0] bg-white text-[#333] hover:bg-[#f5f5f5] transition"
                    aria-label={`${tActions('edit')} ${project.title}`}
                    title={tActions('edit')}
                  >
                    <Pencil size={13} className="sm:w-[14px] sm:h-[14px] md:w-4 md:h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteClick(project)}
                    className="h-7 w-7 sm:h-7 sm:w-7 md:h-8 md:w-8 flex items-center justify-center rounded-full border border-red-200 bg-white text-red-600 hover:bg-red-50 transition"
                    aria-label={`${tActions('delete')} ${project.title}`}
                    title={tActions('delete')}
                  >
                    <Trash2 size={13} className="sm:w-[14px] sm:h-[14px] md:w-4 md:h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination
        totalItems={totalItems}
        currentPage={currentPage}
        totalPages={totalPages}
        startItem={startItem}
        endItem={endItem}
        onPageChange={onPageChange}
        variant="grid"
      />
    </div>
  );
}

