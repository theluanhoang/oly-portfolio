'use client';

import { useRef, useCallback, useState } from 'react';
import { Upload, ImageIcon } from 'lucide-react';
import type { CanvasElement } from '../types';

interface ImageElementProps {
  element: CanvasElement;
  isSelected: boolean;
  onContentChange: (id: string, content: string) => void;
}

export function ImageElement({ element, isSelected, onContentChange }: ImageElementProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleUpload = useCallback(
    async (file: File) => {
      setIsUploading(true);
      setUploadError(null);
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const json = await res.json() as { url?: string; error?: string };
        if (!res.ok) throw new Error(json.error || 'Upload failed');
        const url: string = json.url || '';
        if (url) onContentChange(element.id, url);
        else throw new Error('Không nhận được URL từ server');
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : 'Upload thất bại. Thử lại sau.');
      } finally {
        setIsUploading(false);
      }
    },
    [element.id, onContentChange]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleUpload(file);
      // Reset input so the same file can be re-selected next time
      e.target.value = '';
    },
    [handleUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) handleUpload(file);
    },
    [handleUpload]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Open file picker only on double-click
  const openPicker = useCallback((e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    if (!isUploading) fileInputRef.current?.click();
  }, [isUploading]);

  const objectFit = element.style.objectFit || 'cover';

  // ── Placeholder (no image yet) ─────────────────────────────────────────────
  if (!element.content) {
    return (
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDoubleClick={openPicker}
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f9fafb',
          border: '1.5px dashed #d1d5db',
          borderRadius: element.style.borderRadius != null ? `${element.style.borderRadius}px` : '0',
          cursor: 'default',
          gap: '10px',
          color: '#9ca3af',
          fontSize: '13px',
          fontFamily: 'system-ui, sans-serif',
          opacity: isUploading ? 0.6 : 1,
          transition: 'opacity 0.2s',
          userSelect: 'none',
        }}
      >
        {isUploading ? (
          <>
            <Upload size={24} color="#6b7280" />
            <span>Đang tải lên...</span>
          </>
        ) : (
          <>
            <ImageIcon size={24} color="#d1d5db" />
            <div style={{ textAlign: 'center', lineHeight: 1.6 }}>
              <div style={{ color: '#6b7280', fontWeight: 500 }}>Double-click để chọn ảnh</div>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>hoặc kéo thả ảnh vào đây</div>
            </div>
          </>
        )}
        {uploadError && (
          <span style={{ color: '#ef4444', fontSize: '12px', textAlign: 'center', maxWidth: '90%' }}>
            {uploadError}
          </span>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>
    );
  }

  // ── Has image ──────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        borderRadius: element.style.borderRadius != null ? `${element.style.borderRadius}px` : '0',
        overflow: 'hidden',
        border: element.style.borderWidth
          ? `${element.style.borderWidth}px ${element.style.borderStyle || 'solid'} ${element.style.borderColor || '#ccc'}`
          : 'none',
        opacity: element.style.opacity ?? 1,
        position: 'relative',
      }}
      onDoubleClick={openPicker}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={element.content}
        alt={element.altText || ''}
        style={{
          width: '100%',
          height: '100%',
          objectFit: objectFit,
          display: 'block',
          pointerEvents: 'none',
          userSelect: 'none',
        } as React.CSSProperties}
        draggable={false}
      />

      {/* Uploading overlay */}
      {isUploading && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(255,255,255,0.75)',
          backdropFilter: 'blur(2px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          fontSize: '13px',
          color: '#374151',
        }}>
          <Upload size={20} />
          Đang tải lên...
        </div>
      )}

      {/* Hint shown on select: inform user they can double-click to replace */}
      {isSelected && !isUploading && (
        <div style={{
          position: 'absolute',
          bottom: '6px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.55)',
          color: '#fff',
          borderRadius: '4px',
          padding: '3px 10px',
          fontSize: '11px',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          backdropFilter: 'blur(4px)',
        }}>
          Double-click để đổi ảnh
        </div>
      )}

      {uploadError && (
        <div style={{
          position: 'absolute',
          bottom: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(239,68,68,0.9)',
          color: '#fff',
          borderRadius: '4px',
          padding: '3px 10px',
          fontSize: '11px',
          whiteSpace: 'nowrap',
          backdropFilter: 'blur(4px)',
        }}>
          {uploadError}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </div>
  );
}
