"use client";

import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type UniqueIdentifier,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, Image as ImageIcon, Star, Trash2, Upload, X } from "lucide-react";
import React from "react";

import { Input } from "@/components/forms";
import { Button } from "@/components/ui";

interface GalleryItem {
  url: string;
  originalName?: string;
}

interface UploadProgressItem {
  status: 'uploading' | 'success' | 'error';
  progress?: number;
  error?: string;
}

interface GalleryUploadProps {
  galleryUrls: (string | GalleryItem)[];
  heroImageIndex: number;
  uploading: boolean;
  uploadProgress: Record<string, UploadProgressItem>;
  isDragging: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onClick: () => void;
  onRemove: (index: number) => void;
  onSetHero: (index: number) => void;
  onReorder: (activeId: UniqueIdentifier, overId: UniqueIdentifier) => void;
  error?: string;
}

export default function GalleryUpload({
  galleryUrls,
  heroImageIndex,
  uploading,
  uploadProgress,
  isDragging,
  fileInputRef,
  onFileUpload,
  onDragOver,
  onDragLeave,
  onDrop,
  onClick,
  onRemove,
  onSetHero,
  onReorder,
  error,
}: GalleryUploadProps) {
  const [activeId, setActiveId] = React.useState<UniqueIdentifier | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const getItemId = (item: string | GalleryItem) => (typeof item === 'string' ? item : item.url);
  const items = React.useMemo(() => galleryUrls.map((item) => getItemId(item)), [galleryUrls]);
  const activeItem = React.useMemo(
    () => galleryUrls.find((item) => getItemId(item) === activeId),
    [activeId, galleryUrls],
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorder(active.id, over.id);
    }
    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  return (
    <div>
      <h2 className="text-lg font-normal tracking-[2px] uppercase text-[#333] mb-6 border-b border-[#e0e0e0] pb-2">
        Gallery Ảnh
      </h2>
      <p className="text-xs text-[#666] mb-4">
        Kéo thả ảnh vào đây hoặc click để chọn. Ảnh đầu tiên sẽ được dùng làm hero image. Hỗ trợ JPEG, PNG, WebP, GIF (tối đa 10MB mỗi ảnh).
      </p>

      <Input
        ref={fileInputRef}
        name="gallery-upload"
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        multiple
        onChange={onFileUpload}
        disabled={uploading}
        className="hidden"
      />

      <div
        onClick={onClick}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`
          relative border-2 border-dashed rounded-none transition-all cursor-pointer
          ${isDragging 
            ? 'border-[#333] bg-[#f5f5f5] scale-[1.02]' 
            : 'border-[#e0e0e0] hover:border-[#333] hover:bg-[#fafafa]'
          }
          ${uploading ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
          min-h-[200px] flex flex-col items-center justify-center p-8 md:p-12
        `}
      >
        {isDragging ? (
          <div className="text-center">
            <Upload className="w-16 h-16 mx-auto mb-4 text-[#333]" strokeWidth={1.5} />
            <p className="text-[#333] font-medium text-base mb-2">Thả ảnh vào đây</p>
            <p className="text-[#666] text-sm">Kéo thả nhiều ảnh cùng lúc</p>
          </div>
        ) : (
          <div className="text-center">
            <ImageIcon className="w-20 h-20 mx-auto mb-4 text-[#666]" strokeWidth={1.5} />
            <p className="text-[#333] font-medium text-base mb-2">
              Kéo thả ảnh vào đây hoặc click để chọn
            </p>
            <p className="text-[#666] text-sm">
              Hỗ trợ JPEG, PNG, WebP, GIF • Tối đa 10MB mỗi ảnh
            </p>
          </div>
        )}
      </div>

      {Object.keys(uploadProgress).length > 0 && (
        <div className="mt-4 space-y-2">
          {Object.entries(uploadProgress).map(([filename, progress]) => (
            <div key={filename} className="text-xs text-[#666] bg-[#f5f5f5] p-3 border border-[#e0e0e0]">
              <div className="flex justify-between items-center mb-1">
                <span className="truncate font-medium">{filename}</span>
                <span className="ml-2 flex items-center gap-1">
                  {progress.status === 'uploading' && (
                    <>
                      <Upload className="w-3 h-3 animate-pulse" />
                      <span>Đang upload...</span>
                    </>
                  )}
                  {progress.status === 'success' && (
                    <>
                      <Check className="w-3 h-3 text-green-600" />
                      <span>Thành công</span>
                    </>
                  )}
                  {progress.status === 'error' && (
                    <>
                      <X className="w-3 h-3 text-red-600" />
                      <span>{progress.error}</span>
                    </>
                  )}
                </span>
              </div>
              {progress.status === 'uploading' && (
                <div className="w-full bg-[#e0e0e0] h-1.5 mt-2">
                  <div
                    className="bg-[#333] h-1.5 transition-all"
                    style={{ width: `${progress.progress}%` }}
                  ></div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {galleryUrls.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-[#333] tracking-[1px] uppercase mb-4">
            Ảnh đã upload ({galleryUrls.length})
          </h3>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={({ active }) => setActiveId(active.id)}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <SortableContext items={items} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {galleryUrls.map((item, index) => {
                  const id = getItemId(item);
                  const url = typeof item === 'string' ? item : item.url;
                  return (
                    <SortableImageCard
                      key={id}
                      id={id}
                      url={url}
                      index={index}
                      isHero={index === heroImageIndex}
                      onSetHero={onSetHero}
                      onRemove={onRemove}
                    />
                  );
                })}
              </div>
            </SortableContext>
            <DragOverlay dropAnimation={null}>
              {activeItem ? (
                <ImagePreview url={typeof activeItem === 'string' ? activeItem : activeItem.url} />
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      )}

      {error && (
        <p className="mt-2 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

interface SortableImageCardProps {
  id: UniqueIdentifier;
  url: string;
  index: number;
  isHero: boolean;
  onSetHero: (index: number) => void;
  onRemove: (index: number) => void;
}

function SortableImageCard({ id, url, index, isHero, onSetHero, onRemove }: SortableImageCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: undefined,
    opacity: isDragging ? 0.5 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="relative group touch-none select-none"
    >
      <div className="aspect-square overflow-hidden border border-[#e0e0e0] bg-[#f5f5f5]">
        <img
          src={url}
          alt={`Gallery ${index + 1}`}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23e0e0e0" width="400" height="400"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage not found%3C/text%3E%3C/svg%3E';
          }}
        />
      </div>
      {isHero && (
        <div className="absolute top-2 left-2 bg-[#333] text-white text-xs px-2 py-1 font-medium">
          Hero
        </div>
      )}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSetHero(index);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          variant={isHero ? 'primary' : 'secondary'}
          size="sm"
          className="p-1.5! rounded! min-w-0!"
          title={isHero ? 'Đang là ảnh chính' : 'Đặt làm ảnh chính'}
        >
          <Star className={`w-3.5 h-3.5 ${isHero ? 'fill-current' : ''}`} />
        </Button>
        <Button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(index);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          variant="danger"
          size="sm"
          className="p-1.5! rounded! min-w-0!"
          title="Xóa ảnh"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

interface ImagePreviewProps {
  url: string;
}

function ImagePreview({ url }: ImagePreviewProps) {
  return (
    <div className="w-[150px] aspect-square overflow-hidden border border-[#e0e0e0] bg-[#f5f5f5]">
      <img
        src={url}
        alt="Dragging image"
        className="w-full h-full object-cover"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23e0e0e0" width="400" height="400"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage not found%3C/text%3E%3C/svg%3E';
        }}
      />
    </div>
  );
}

