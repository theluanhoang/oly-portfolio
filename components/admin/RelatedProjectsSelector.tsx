'use client';

import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Check, GripVertical, Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface RelatedProject {
  id: string;
  slug: string;
  heroImage: string | null;
  title: string;
  category: string | null;
  location: string | null;
  year: string | null;
}

interface RelatedProjectsSelectorProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  excludeSlug?: string;
  label?: string;
  description?: string;
  loadingLabel?: string;
  emptyLabel?: string;
  noResultsLabel?: string;
  searchPlaceholder?: string;
  maxItems?: number;
}

export default function RelatedProjectsSelector({
  selectedIds,
  onChange,
  excludeSlug,
  label = 'Dự án liên quan',
  description = 'Chọn các dự án sẽ hiển thị ở sidebar trang chi tiết. Bạn có thể kéo thả để sắp xếp thứ tự.',
  loadingLabel = 'Đang tải danh sách dự án...',
  emptyLabel = 'Chưa có dự án nào được chọn',
  noResultsLabel = 'Không tìm thấy dự án phù hợp',
  searchPlaceholder = 'Tìm theo tiêu đề, slug...',
  maxItems,
}: RelatedProjectsSelectorProps) {
  const [allProjects, setAllProjects] = useState<RelatedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    let cancelled = false;

    async function loadProjects() {
      try {
        setLoading(true);
        const res = await fetch('/api/projects?pageSize=100&sortField=displayOrder&sortDirection=asc', {
          cache: 'no-store',
        });
        if (!res.ok) throw new Error('Failed to fetch projects');
        const data = await res.json();
        if (cancelled) return;
        const items: RelatedProject[] = (data.items || []).map((p: RelatedProject) => ({
          id: p.id,
          slug: p.slug,
          heroImage: p.heroImage || null,
          title: p.title || '',
          category: p.category || null,
          location: p.location || null,
          year: p.year || null,
        }));
        setAllProjects(items);
      } catch (err) {
        console.error('Error loading projects for related selector:', err);
        if (!cancelled) setAllProjects([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProjects();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setPopoverOpen(false);
      }
    }
    if (popoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [popoverOpen]);

  const availableProjects = useMemo(() => {
    return allProjects.filter((p) => p.slug !== excludeSlug);
  }, [allProjects, excludeSlug]);

  const selectedProjects = useMemo(() => {
    const idToProject = new Map(availableProjects.map((p) => [p.id, p] as const));
    const result: RelatedProject[] = [];
    selectedIds.forEach((id) => {
      const project = idToProject.get(id);
      if (project) result.push(project);
    });
    return result;
  }, [availableProjects, selectedIds]);

  const filteredAvailable = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    const selectedIdSet = new Set(selectedIds);
    return availableProjects.filter((p) => {
      if (selectedIdSet.has(p.id)) return false;
      if (!search) return true;
      return (
        p.title.toLowerCase().includes(search) ||
        p.slug.toLowerCase().includes(search)
      );
    });
  }, [availableProjects, selectedIds, searchTerm]);

  const handleAdd = (project: RelatedProject) => {
    if (maxItems && selectedIds.length >= maxItems) return;
    if (selectedIds.includes(project.id)) return;
    onChange([...selectedIds, project.id]);
    setSearchTerm('');
    inputRef.current?.focus();
  };

  const handleRemove = (id: string) => {
    onChange(selectedIds.filter((item) => item !== id));
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const oldIndex = selectedIds.indexOf(String(active.id));
    const newIndex = selectedIds.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    onChange(arrayMove(selectedIds, oldIndex, newIndex));
  };

  const activeProject = activeId
    ? selectedProjects.find((p) => p.id === activeId)
    : null;

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-base font-bold text-black tracking-[0.16px] leading-normal mb-2 font-montserrat">
          {label}
        </label>
        {description && (
          <p className="text-xs text-[#666] mb-3 leading-relaxed">{description}</p>
        )}
      </div>

      <div className="relative" ref={popoverRef}>
        <div
          className="w-full h-[44px] border border-black px-4 pr-10 rounded-lg bg-white text-[#333] outline-none focus-within:border-black transition-colors flex items-center cursor-text"
          onClick={() => {
            setPopoverOpen(true);
            setTimeout(() => inputRef.current?.focus(), 0);
          }}
        >
          <input
            ref={inputRef}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPopoverOpen(true);
            }}
            onFocus={() => setPopoverOpen(true)}
            placeholder={searchPlaceholder}
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-[#999]"
          />
          <Search className="w-4 h-4 text-[#999]" />
        </div>

        {popoverOpen && (
          <div className="absolute z-30 mt-1 w-full max-h-[280px] overflow-y-auto rounded-none border border-[#e0e0e0] bg-white shadow">
            {loading ? (
              <div className="px-3 py-3 text-sm text-[#666]">{loadingLabel}</div>
            ) : filteredAvailable.length === 0 ? (
              <div className="px-3 py-3 text-sm text-[#666]">{noResultsLabel}</div>
            ) : (
              filteredAvailable.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleAdd(project)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-100 transition-colors"
                >
                  <div className="w-12 h-12 shrink-0 bg-[#f5f5f5] border border-[#e0e0e0] overflow-hidden">
                    {project.heroImage ? (
                      <img
                        src={project.heroImage}
                        alt={project.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-[#999]">
                        N/A
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#333] truncate">
                      {project.title || project.slug}
                    </p>
                    <p className="text-xs text-[#666] truncate">
                      {[
                        project.category,
                        project.location,
                        project.year,
                      ]
                        .filter(Boolean)
                        .join(' • ') || project.slug}
                    </p>
                  </div>
                  <Check className="w-4 h-4 text-[#333] opacity-0 hover:opacity-100" />
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div className="border border-[#e0e0e0] bg-[#fafafa] rounded-none">
        <div className="flex items-center justify-between px-3 py-2 border-b border-[#e0e0e0] bg-white">
          <p className="text-xs font-medium uppercase tracking-[1px] text-[#555]">
            Đã chọn ({selectedIds.length})
            {maxItems ? ` / ${maxItems}` : ''}
          </p>
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs text-[#666] hover:text-[#333] underline-offset-2 hover:underline"
            >
              Xóa tất cả
            </button>
          )}
        </div>

        {selectedIds.length === 0 ? (
          <div className="px-3 py-6 text-sm text-[#666] text-center">
            {emptyLabel}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={selectedIds}
              strategy={verticalListSortingStrategy}
            >
              <ul className="divide-y divide-[#e0e0e0]">
                {selectedProjects.map((project, index) => (
                  <SortableRelatedProject
                    key={project.id}
                    id={project.id}
                    project={project}
                    index={index}
                    onRemove={handleRemove}
                  />
                ))}
              </ul>
            </SortableContext>
            <DragOverlay dropAnimation={null}>
              {activeProject ? (
                <RelatedProjectRow
                  project={activeProject}
                  index={selectedProjects.findIndex((p) => p.id === activeProject.id)}
                  onRemove={() => {}}
                  isOverlay
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </div>
  );
}

interface SortableRelatedProjectProps {
  id: string;
  project: RelatedProject;
  index: number;
  onRemove: (id: string) => void;
}

function SortableRelatedProject({
  id,
  project,
  index,
  onRemove,
}: SortableRelatedProjectProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <li ref={setNodeRef} style={style} className="bg-white">
      <RelatedProjectRow
        project={project}
        index={index}
        onRemove={onRemove}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </li>
  );
}

interface RelatedProjectRowProps {
  project: RelatedProject;
  index: number;
  onRemove: (id: string) => void;
  isOverlay?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
}

function RelatedProjectRow({
  project,
  index,
  onRemove,
  isOverlay,
  dragHandleProps,
}: RelatedProjectRowProps) {
  return (
    <div
      className={`flex items-center gap-3 px-3 py-2 ${isOverlay ? 'shadow-lg border border-[#333]' : ''}`}
    >
      <button
        type="button"
        className="shrink-0 w-7 h-7 flex items-center justify-center text-[#999] hover:text-[#333] cursor-grab active:cursor-grabbing touch-none"
        title="Kéo để sắp xếp lại"
        {...dragHandleProps}
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <span className="shrink-0 w-7 h-7 flex items-center justify-center text-xs font-bold text-[#333] bg-[#f0f0f0] border border-[#e0e0e0]">
        {index + 1}
      </span>
      <div className="w-12 h-12 shrink-0 bg-[#f5f5f5] border border-[#e0e0e0] overflow-hidden">
        {project.heroImage ? (
          <img
            src={project.heroImage}
            alt={project.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[10px] text-[#999]">
            N/A
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#333] truncate">
          {project.title || project.slug}
        </p>
        <p className="text-xs text-[#666] truncate">
          {[
            project.category,
            project.location,
            project.year,
          ]
            .filter(Boolean)
            .join(' • ') || project.slug}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onRemove(project.id)}
        onPointerDown={(e) => e.stopPropagation()}
        className="shrink-0 w-7 h-7 flex items-center justify-center text-[#999] hover:text-red-600 hover:bg-red-50 transition-colors"
        title="Xóa khỏi danh sách"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}