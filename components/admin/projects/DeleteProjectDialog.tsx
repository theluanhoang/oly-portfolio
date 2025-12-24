'use client';

import { useTranslations } from 'next-intl';
import Button from '@/components/ui/Button';
import { Project } from '@/types/project';

interface DeleteProjectDialogProps {
  project: Project | null;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteProjectDialog({
  project,
  isDeleting,
  onCancel,
  onConfirm,
}: DeleteProjectDialogProps) {
  const t = useTranslations('Admin.projects.list.deleteDialog');
  
  if (!project) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4 md:p-4">
      <div className="bg-white border border-[#e0e0e0] w-full max-w-md shadow-lg">
        <div className="px-4 sm:px-6 md:px-6 py-3 sm:py-4 md:py-4 border-b border-[#e0e0e0]">
          <h2 className="text-sm sm:text-base md:text-base font-semibold tracking-[1px] sm:tracking-[1.5px] md:tracking-[2px] uppercase text-[#333]">
            {t('title')}
          </h2>
        </div>
        <div className="px-4 sm:px-6 md:px-6 py-4 sm:py-5 md:py-5 space-y-2">
          <p className="text-xs sm:text-sm md:text-sm text-[#333]">
            {t('confirmMessage')}
            <span className="font-semibold"> {project.title}</span>?
          </p>
          <p className="text-[10px] sm:text-xs md:text-xs text-[#777]">
            {t('cannotUndo')}
          </p>
        </div>
        <div className="px-4 sm:px-6 md:px-6 py-3 sm:py-4 md:py-4 border-t border-[#e0e0e0] flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 md:gap-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onCancel}
            disabled={isDeleting}
            className="w-full sm:w-auto"
          >
            {t('cancel')}
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={onConfirm}
            disabled={isDeleting}
            className="w-full sm:w-auto"
          >
            {isDeleting ? t('deleting') : t('delete')}
          </Button>
        </div>
      </div>
    </div>
  );
}

