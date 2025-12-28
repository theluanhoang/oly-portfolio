'use client';

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
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

interface PendingUpdate {
  slug: string;
  displayOrder: number;
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

const batchReorderProjects = async (updates: PendingUpdate[]): Promise<Response> => {
  return fetch('/api/projects/reorder', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ updates }),
  });
};

const reorderProjectsOptimistically = (
  projects: Project[],
  draggedProject: Project,
  targetProject: Project | undefined,
  targetSectionIndex: number | undefined,
  targetPosition: number | undefined
): Project[] => {
  if (targetSectionIndex !== undefined && targetPosition !== undefined && !targetProject) {
    const newDisplayOrder = calculateDisplayOrder(targetSectionIndex, targetPosition);
    return projects.map(p =>
      p.slug === draggedProject.slug ? { ...p, displayOrder: newDisplayOrder } : p
    );
  } else if (targetProject && draggedProject.slug !== targetProject.slug) {
    const draggedOrder = draggedProject.displayOrder || 0;
    const targetOrder = targetProject.displayOrder || 0;
    return projects.map(p => {
      if (p.slug === draggedProject.slug) {
        return { ...p, displayOrder: targetOrder };
      }
      if (p.slug === targetProject.slug) {
        return { ...p, displayOrder: draggedOrder };
      }
      return p;
    });
  }
  return projects;
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onOrderUpdate,
}: ProjectsOrderViewProps) {
  const [dragState, setDragState] = useState<DragState>({
    project: null,
    overProject: null,
    overSection: null,
  });
  
  const [localProjects, setLocalProjects] = useState<Project[]>(projects);
  const [pendingUpdates, setPendingUpdates] = useState<Map<string, PendingUpdate>>(new Map());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  
  const projectsSnapshotRef = useRef<Project[]>(projects);
  const lastSyncedProjectsRef = useRef<Project[]>(projects);

  const dragOverRefs = useRef<DragOverRefs>({
    projectSlug: null,
    section: null,
    isEmpty: false,
  });

  useEffect(() => {
    if (pendingUpdates.size === 0 && !isSyncing) {
      const lastSynced = lastSyncedProjectsRef.current;
      const projectsChanged = 
        projects.length !== lastSynced.length ||
        projects.some((p, idx) => {
          const last = lastSynced[idx];
          return !last || p.slug !== last.slug || p.displayOrder !== last.displayOrder;
        });
      
      if (projectsChanged) {
        setLocalProjects(projects);
        projectsSnapshotRef.current = projects;
        lastSyncedProjectsRef.current = projects;
      }
    }
  }, [projects, pendingUpdates.size, isSyncing]);

  const groupedSections = useMemo(() => groupProjectsBySections(localProjects), [localProjects]);

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

  useEffect(() => {
    if (pendingUpdates.size === 0) return;

    const timer = setTimeout(async () => {
      const updatesArray = Array.from(pendingUpdates.values());
      
      if (updatesArray.length === 0) {
        setPendingUpdates(new Map());
        return;
      }

      setIsSyncing(true);
      setSyncError(null);

      try {
        const response = await batchReorderProjects(updatesArray);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || 'Failed to sync order');
        }

        setPendingUpdates(new Map());
        setLocalProjects(current => {
          projectsSnapshotRef.current = [...current];
          return current;
        });
      } catch (error) {
        console.error('[Sync Error]', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to sync order';
        setSyncError(errorMessage);
        
        setLocalProjects(projectsSnapshotRef.current);
        setPendingUpdates(new Map());
        
        alert(`Không thể đồng bộ thứ tự: ${errorMessage}`);
      } finally {
        setIsSyncing(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [pendingUpdates]);

  const handleDrop = useCallback(
    (
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

      if (pendingUpdates.size === 0) {
        projectsSnapshotRef.current = [...localProjects];
      }

      formatProjectsForLog(localProjects, 'BEFORE SWAP');

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

      const updatedProjects = reorderProjectsOptimistically(
        localProjects,
        dragState.project,
        targetProject,
        targetSectionIndex,
        targetPosition
      );

      const projectsMap = new Map(localProjects.map(p => [p.slug, p]));
      const hasChanges = updatedProjects.some(p => {
        const original = projectsMap.get(p.slug);
        return !original || p.displayOrder !== original.displayOrder;
      });

      if (!hasChanges) {
        resetDragState();
        return;
      }

      setLocalProjects(updatedProjects);
      formatProjectsForLog(updatedProjects, 'AFTER SWAP (OPTIMISTIC)');

      const updatesToAdd = new Map(pendingUpdates);

      if (targetSectionIndex !== undefined && targetPosition !== undefined && !targetProject) {
        const newDisplayOrder = calculateDisplayOrder(targetSectionIndex, targetPosition);
        const oldDisplayOrder = dragState.project.displayOrder || 0;

        if (oldDisplayOrder !== newDisplayOrder) {
          updatesToAdd.set(dragState.project.slug, {
            slug: dragState.project.slug,
            displayOrder: newDisplayOrder,
          });
        }
      } else if (targetProject && dragState.project.slug !== targetProject.slug) {
        const draggedOrder = dragState.project.displayOrder || 0;
        const targetOrder = targetProject.displayOrder || 0;

        updatesToAdd.set(dragState.project.slug, {
          slug: dragState.project.slug,
          displayOrder: targetOrder,
        });
        updatesToAdd.set(targetProject.slug, {
          slug: targetProject.slug,
          displayOrder: draggedOrder,
        });
      }

      setPendingUpdates(updatesToAdd);

      const updatesLog = Array.from(updatesToAdd.values()).map(u => ({
        slug: u.slug,
        newOrder: u.displayOrder,
      }));
      console.log('[UPDATES] Added to queue:', updatesLog);

      resetDragState();
    },
    [dragState.project, localProjects, pendingUpdates, resetDragState]
  );

  const handleDragEnd = useCallback(() => {
    resetDragState();
  }, [resetDragState]);

  const handleReset = useCallback(async () => {
    if (!confirm('Bạn có chắc chắn muốn reset vị trí của tất cả projects? Hành động này không thể hoàn tác.')) {
      return;
    }

    setIsSyncing(true);
    setSyncError(null);
    
    try {
      const sortedProjects = [...localProjects].sort((a, b) => {
        if (a.displayOrder !== b.displayOrder) {
          return (a.displayOrder || 0) - (b.displayOrder || 0);
        }
        return (a.title || '').localeCompare(b.title || '');
      });

      const updates: PendingUpdate[] = sortedProjects
        .map((project, index) => {
          const sectionIndex = Math.floor(index / PROJECTS_PER_SECTION);
          const positionInSection = index % PROJECTS_PER_SECTION;
          const newDisplayOrder = calculateDisplayOrder(sectionIndex, positionInSection);

          if (project.displayOrder !== newDisplayOrder) {
            return {
              slug: project.slug,
              displayOrder: newDisplayOrder,
            };
          }
          return null;
        })
        .filter((update): update is PendingUpdate => update !== null);

      if (updates.length > 0) {
        const resetProjects = sortedProjects.map((project, index) => {
          const sectionIndex = Math.floor(index / PROJECTS_PER_SECTION);
          const positionInSection = index % PROJECTS_PER_SECTION;
          const newDisplayOrder = calculateDisplayOrder(sectionIndex, positionInSection);
          return { ...project, displayOrder: newDisplayOrder };
        });
        
        projectsSnapshotRef.current = [...localProjects];
        setLocalProjects(resetProjects);
        setPendingUpdates(new Map(updates.map(u => [u.slug, u])));
        
        const response = await batchReorderProjects(updates);
        
        if (!response.ok) {
          throw new Error('Failed to reset order');
        }

        setPendingUpdates(new Map());
        projectsSnapshotRef.current = [...resetProjects];
      }
    } catch (error) {
      console.error('[Reset] Error:', error);
      setLocalProjects(projectsSnapshotRef.current);
      setPendingUpdates(new Map());
      alert('Không thể reset vị trí. Vui lòng thử lại.');
    } finally {
      setIsSyncing(false);
    }
  }, [localProjects]);

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
            disabled={isSyncing || localProjects.length === 0}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium transition-colors"
          >
            Reset Vị Trí
          </button>
        </div>
        <div className="flex items-center gap-2">
          {isSyncing && (
            <p className="text-sm text-blue-600">Đang đồng bộ thứ tự...</p>
          )}
          {syncError && (
            <p className="text-sm text-red-600">Lỗi: {syncError}</p>
          )}
          {pendingUpdates.size > 0 && !isSyncing && (
            <p className="text-sm text-gray-500">
              Đang chờ đồng bộ ({pendingUpdates.size} thay đổi)...
            </p>
          )}
        </div>
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
                    draggable={!isSyncing && !!project}
                    data-empty-slot={isEmpty ? 'true' : undefined}
                    onDragStart={e => {
                      if (!isSyncing && project) {
                        handleDragStart(project);
                        if (e.dataTransfer) {
                          e.dataTransfer.effectAllowed = 'move';
                        }
                      }
                    }}
                    onDragOver={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!isSyncing && dragState.project) {
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
                      if (!isSyncing && dragState.project) {
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
                      ${isSyncing ? 'pointer-events-none' : ''}
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
