'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import { Project } from '@/types/project';

interface ProjectsOrderViewProps {
  projects: Project[];
  loading: boolean;
  error: string | null;
  onOrderUpdate: () => void;
}

interface DragState {
  project: Project | null;
  overProject: Project | null;
  overSection: number | null;
}

interface DragOverRefs {
  projectSlug: string | null;
  section: number | null;
  isEmpty: boolean;
}

const PROJECTS_PER_SECTION = 4;
const EMPTY_IMAGE_PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="600"%3E%3Crect fill="%23e0e0e0" width="800" height="600"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em" font-size="18"%3EImage not found%3C/text%3E%3C/svg%3E';

const getGridPosition = (isLayout1: boolean, imageIndex: number): string => {
  const layouts = {
    layout1: [
      'row-span-2 col-span-3 row-start-1 col-start-1',
      'row-span-3 col-span-2 row-start-1 col-start-4',
      'row-span-3 col-span-3 row-start-3 col-start-1',
      'row-span-2 col-span-2 row-start-4 col-start-4',
    ],
    layout2: [
      'row-span-2 col-span-2 row-start-1 col-start-1',
      'row-span-3 col-span-3 row-start-1 col-start-3',
      'row-span-3 col-span-2 row-start-3 col-start-1',
      'row-span-2 col-span-3 row-start-4 col-start-3',
    ],
  };
  return isLayout1 ? layouts.layout1[imageIndex] : layouts.layout2[imageIndex];
};

const calculateDisplayOrder = (sectionIndex: number, positionInSection: number): number => {
  return sectionIndex * PROJECTS_PER_SECTION + positionInSection;
};

const getSectionFromDisplayOrder = (displayOrder: number): { sectionIndex: number; positionInSection: number } => {
  return {
    sectionIndex: Math.floor(displayOrder / PROJECTS_PER_SECTION),
    positionInSection: displayOrder % PROJECTS_PER_SECTION,
  };
};

const groupProjectsBySections = (projects: Project[]): (Project | null)[][] => {
  if (projects.length === 0) return [];

  const maxDisplayOrder = Math.max(...projects.map(p => p.displayOrder || 0), 0);
  const maxSectionIndex = Math.floor(maxDisplayOrder / PROJECTS_PER_SECTION);
  const groupedSections: (Project | null)[][] = [];

  for (let sectionIdx = 0; sectionIdx <= maxSectionIndex; sectionIdx++) {
    const section: (Project | null)[] = Array(PROJECTS_PER_SECTION).fill(null);
    const sectionStartDisplayOrder = sectionIdx * PROJECTS_PER_SECTION;
    const sectionEndDisplayOrder = sectionStartDisplayOrder + PROJECTS_PER_SECTION;

    projects
      .filter(p => {
        const displayOrder = p.displayOrder || 0;
        return displayOrder >= sectionStartDisplayOrder && displayOrder < sectionEndDisplayOrder;
      })
      .forEach(project => {
        const positionInSection = (project.displayOrder || 0) % PROJECTS_PER_SECTION;
        if (positionInSection >= 0 && positionInSection < PROJECTS_PER_SECTION) {
          section[positionInSection] = project;
        }
      });

    groupedSections.push(section);
  }

  return groupedSections;
};

const updateProjectDisplayOrder = async (slug: string, displayOrder: number): Promise<Response> => {
  return fetch(`/api/projects/${encodeURIComponent(slug)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ displayOrder }),
  });
};

const formatProjectsForLog = (projectsList: Project[], label: string) => {
  if (process.env.NODE_ENV !== 'development') return;

  const formatted = projectsList
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
    .map(p => {
      const { sectionIndex, positionInSection } = getSectionFromDisplayOrder(p.displayOrder || 0);
      return {
        title: p.title,
        displayOrder: p.displayOrder,
        sectionIndex,
        positionInSection,
      };
    });

  console.group(`[${label}] All projects (${formatted.length} total)`);
  console.table(formatted);

  const sectionsMap = new Map<number, typeof formatted>();
  formatted.forEach(p => {
    if (!sectionsMap.has(p.sectionIndex)) {
      sectionsMap.set(p.sectionIndex, []);
    }
    sectionsMap.get(p.sectionIndex)!.push(p);
  });

  sectionsMap.forEach((sectionProjects, sectionIdx) => {
    console.log(
      `Section ${sectionIdx}:`,
      sectionProjects.map(p => `[${p.positionInSection}] ${p.title} (order: ${p.displayOrder})`).join(', ')
    );
  });
  console.groupEnd();
};

export function ProjectsOrderView({
  projects,
  loading,
  error,
  onOrderUpdate,
}: ProjectsOrderViewProps) {
  const [dragState, setDragState] = useState<DragState>({
    project: null,
    overProject: null,
    overSection: null,
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // Refs để track target hiện tại, tránh update state không cần thiết
  const dragOverRefs = useRef<DragOverRefs>({
    projectSlug: null,
    section: null,
    isEmpty: false,
  });

  // Memoize grouped sections để tránh tính toán lại không cần thiết
  const groupedSections = useMemo(() => groupProjectsBySections(projects), [projects]);

  const resetDragState = useCallback(() => {
    setDragState({
      project: null,
      overProject: null,
      overSection: null,
    });
    dragOverRefs.current = {
      projectSlug: null,
      section: null,
      isEmpty: false,
    };
  }, []);

  const handleDragStart = useCallback((project: Project) => {
    setDragState(prev => ({ ...prev, project }));
    dragOverRefs.current = {
      projectSlug: null,
      section: null,
      isEmpty: false,
    };
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, project?: Project, sectionIndex?: number, isEmpty?: boolean) => {
      e.preventDefault();
      e.stopPropagation();

      if (!dragState.project) return;

      const currentProjectSlug = project?.slug || null;
      const currentSection = sectionIndex ?? null;
      const currentIsEmpty = isEmpty ?? false;

      const projectChanged = dragOverRefs.current.projectSlug !== currentProjectSlug;
      const sectionChanged = dragOverRefs.current.section !== currentSection;
      const isEmptyChanged = dragOverRefs.current.isEmpty !== currentIsEmpty;

      if (projectChanged || sectionChanged || isEmptyChanged) {
        setDragState(prev => ({
          ...prev,
          overProject: isEmpty ? null : project && project.slug !== dragState.project?.slug ? project : null,
          overSection: sectionIndex ?? null,
        }));

        dragOverRefs.current = {
          projectSlug: currentProjectSlug,
          section: currentSection,
          isEmpty: currentIsEmpty,
        };
      }
    },
    [dragState.project]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    const currentTarget = e.currentTarget;
    const relatedTarget = e.relatedTarget as Node | null;

    if (relatedTarget && !currentTarget.contains(relatedTarget)) {
      const isMovingToProject = relatedTarget instanceof HTMLElement && relatedTarget.closest('[draggable="true"]');

      if (!isMovingToProject) {
        setDragState(prev => ({
          ...prev,
          overProject: null,
          overSection: null,
        }));
      }
    }
  }, []);

  const handleDrop = useCallback(
    async (
      e: React.DragEvent,
      targetProject?: Project,
      targetSectionIndex?: number,
      targetPosition?: number
    ) => {
      e.preventDefault();
      e.stopPropagation();

      if (!dragState.project) {
        resetDragState();
        return;
      }

      formatProjectsForLog(projects, 'BEFORE SWAP');

      if (dragState.project) {
        const { sectionIndex, positionInSection } = getSectionFromDisplayOrder(dragState.project.displayOrder || 0);
        console.log('[DROP INFO]', {
          draggedProject: dragState.project.title,
          from: {
            sectionIndex,
            positionInSection,
            displayOrder: dragState.project.displayOrder,
          },
          to: targetProject
            ? {
                sectionIndex: targetSectionIndex,
                targetProject: targetProject.title,
              }
            : {
                sectionIndex: targetSectionIndex,
                positionInSection: targetPosition,
                isEmpty: true,
              },
        });
      }

      setIsUpdating(true);
      try {
        if (targetSectionIndex !== undefined && targetPosition !== undefined && !targetProject) {
          const newDisplayOrder = calculateDisplayOrder(targetSectionIndex, targetPosition);
          const oldDisplayOrder = dragState.project.displayOrder || 0;

          if (oldDisplayOrder !== newDisplayOrder) {
            const projectsAfterSwap = projects.map(p =>
              p.slug === dragState.project!.slug ? { ...p, displayOrder: newDisplayOrder } : p
            );
            formatProjectsForLog(projectsAfterSwap, 'AFTER SWAP');

            const updatesLog = [
              {
                project: dragState.project.title,
                oldOrder: oldDisplayOrder,
                newOrder: newDisplayOrder,
              },
            ];

            console.log('[UPDATES] Will update displayOrder for:', updatesLog);
            console.table(updatesLog);

            await updateProjectDisplayOrder(dragState.project.slug, newDisplayOrder);
          } else {
            console.log('[UPDATES] No updates needed');
          }
        }
        // Swap với project khác
        else if (targetProject && dragState.project.slug !== targetProject.slug) {
          const draggedOrder = dragState.project.displayOrder || 0;
          const targetOrder = targetProject.displayOrder || 0;

          await Promise.all([
            updateProjectDisplayOrder(dragState.project.slug, targetOrder),
            updateProjectDisplayOrder(targetProject.slug, draggedOrder),
          ]);
        } else {
          resetDragState();
          setIsUpdating(false);
          return;
        }

        onOrderUpdate();
      } catch (error) {
        console.error('[Drop] Error:', error);
        alert('Failed to update order. Please try again.');
      } finally {
        setIsUpdating(false);
        resetDragState();
      }
    },
    [dragState.project, projects, onOrderUpdate, resetDragState]
  );

  const handleDragEnd = useCallback(() => {
    resetDragState();
  }, [resetDragState]);

  const handleReset = useCallback(async () => {
    if (!confirm('Bạn có chắc chắn muốn reset vị trí của tất cả projects? Hành động này không thể hoàn tác.')) {
      return;
    }

    setIsUpdating(true);
    try {
      const sortedProjects = [...projects].sort((a, b) => {
        if (a.displayOrder !== b.displayOrder) {
          return (a.displayOrder || 0) - (b.displayOrder || 0);
        }
        return (a.title || '').localeCompare(b.title || '');
      });

      const updates = sortedProjects
        .map((project, index) => {
          const sectionIndex = Math.floor(index / PROJECTS_PER_SECTION);
          const positionInSection = index % PROJECTS_PER_SECTION;
          const newDisplayOrder = calculateDisplayOrder(sectionIndex, positionInSection);

          if (project.displayOrder !== newDisplayOrder) {
            return updateProjectDisplayOrder(project.slug, newDisplayOrder);
          }
          return null;
        })
        .filter((update): update is Promise<Response> => update !== null);

      if (updates.length > 0) {
        await Promise.all(updates);
      }

      onOrderUpdate();
    } catch (error) {
      console.error('[Reset] Error:', error);
      alert('Không thể reset vị trí. Vui lòng thử lại.');
    } finally {
      setIsUpdating(false);
    }
  }, [projects, onOrderUpdate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Đang tải...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-gray-600">
            <strong>Hướng dẫn:</strong> Kéo và thả các project để sắp xếp thứ tự hiển thị
          </p>
          <button
            onClick={handleReset}
            disabled={isUpdating || projects.length === 0}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium transition-colors"
          >
            Reset Vị Trí
          </button>
        </div>
        {isUpdating && <p className="text-sm text-blue-600">Đang cập nhật thứ tự...</p>}
      </div>

      <div className="flex flex-wrap gap-4">
        {groupedSections.map((sectionProjects, sectionIndex) => {
          const isLayout1 = sectionIndex % 2 === 0;
          const isSectionDragOver = dragState.overSection === sectionIndex;

          return (
            <div
              key={sectionIndex}
              onDragOver={e => {
                if (!(e.target as HTMLElement).closest('[draggable="true"], [data-empty-slot="true"]')) {
                  handleDragOver(e, undefined, sectionIndex);
                }
              }}
              onDragLeave={handleDragLeave}
              className={`
                w-full md:w-[calc((100%-16px)/2)] lg:w-[calc((100%-32px)/3)] aspect-square max-w-[500px] relative grid grid-cols-5 grid-rows-5 gap-2 bg-gray-100 p-2 rounded-lg
                ${isSectionDragOver ? 'ring-2 ring-blue-400 ring-offset-2 bg-blue-50' : ''}
                transition-all duration-200
              `}
            >
              {Array.from({ length: PROJECTS_PER_SECTION }).map((_, imageIndex) => {
                const project = sectionProjects[imageIndex];
                const isDragging = project && dragState.project?.slug === project.slug;
                const isDragOver = project && dragState.overProject?.slug === project.slug;
                const isEmpty = !project;
                const canDropOnEmpty = isEmpty && dragState.project;

                return (
                  <div
                    key={project?.slug || `empty-${sectionIndex}-${imageIndex}`}
                    draggable={!isUpdating && !!project}
                    data-empty-slot={isEmpty ? 'true' : undefined}
                    onDragStart={e => {
                      if (!isUpdating && project) {
                        handleDragStart(project);
                        if (e.dataTransfer) {
                          e.dataTransfer.effectAllowed = 'move';
                        }
                      }
                    }}
                    onDragOver={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!isUpdating && dragState.project) {
                        if (project && project.slug !== dragState.project.slug) {
                          handleDragOver(e, project, sectionIndex, false);
                        } else if (canDropOnEmpty) {
                          handleDragOver(e, undefined, sectionIndex, true);
                        }
                      }
                    }}
                    onDragLeave={handleDragLeave}
                    onDrop={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!isUpdating && dragState.project) {
                        if (project && project.slug !== dragState.project.slug) {
                          handleDrop(e, project, sectionIndex);
                        } else if (canDropOnEmpty) {
                          handleDrop(e, undefined, sectionIndex, imageIndex);
                        }
                      }
                    }}
                    onDragEnd={handleDragEnd}
                    className={`
                      relative overflow-hidden group
                      ${getGridPosition(isLayout1, imageIndex)}
                      ${project ? 'cursor-move' : 'cursor-default'}
                      ${isDragging ? 'opacity-50 scale-95 z-50' : ''}
                      ${isDragOver ? 'ring-2 ring-blue-500 ring-offset-2 z-40' : ''}
                      ${canDropOnEmpty && dragState.overSection === sectionIndex ? 'ring-2 ring-dashed ring-blue-300 bg-blue-100/50' : ''}
                      ${isUpdating ? 'pointer-events-none' : ''}
                      ${isEmpty ? 'border-2 border-dashed border-gray-300 bg-gray-50' : ''}
                      transition-all duration-200
                    `}
                  >
                    {project ? (
                      <>
                        <img
                          src={project.heroImage}
                          alt={project.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={e => {
                            const target = e.target as HTMLImageElement;
                            target.src = EMPTY_IMAGE_PLACEHOLDER;
                          }}
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center px-2">
                          <h3 className="text-white text-xs font-normal uppercase tracking-wider text-center mb-1">
                            {project.title}
                          </h3>
                          <p className="text-white/80 text-[10px] font-normal tracking-wider text-center">
                            {project.category}
                          </p>
                          <p className="text-white/60 text-[10px] font-normal mt-1">
                            Thứ tự: {project.displayOrder ?? 0}
                          </p>
                        </div>
                        <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                          {project.displayOrder ?? 0}
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {canDropOnEmpty ? (
                          <p className="text-gray-400 text-xs text-center px-2">Thả vào đây</p>
                        ) : (
                          <p className="text-gray-300 text-xs text-center px-2">Trống</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
