'use client';

import { useState, useCallback } from 'react';
import type { CanvasElement } from '../types';

interface VideoElementProps {
  element: CanvasElement;
  isSelected: boolean;
  onContentChange: (id: string, content: string) => void;
}

/** Extract YouTube video ID from any YouTube URL format */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  // youtu.be/ID
  const short = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (short) return short[1];
  // youtube.com/watch?v=ID or /embed/ID or /v/ID
  const long = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (long) return long[1];
  return null;
}

/** Build the embeddable iframe src from a YouTube URL or video ID */
export function toEmbedUrl(input: string): string | null {
  const id = extractYouTubeId(input) ?? (input.match(/^[a-zA-Z0-9_-]{11}$/) ? input : null);
  if (!id) return null;
  return `https://www.youtube.com/embed/${id}?rel=0`;
}

export function VideoElement({ element, isSelected, onContentChange }: VideoElementProps) {
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const embedSrc = toEmbedUrl(element.content || element.embedUrl || '');

  const handleConfirm = useCallback(() => {
    const src = toEmbedUrl(inputValue.trim());
    if (src) {
      onContentChange(element.id, inputValue.trim());
    }
    setEditing(false);
    setInputValue('');
  }, [element.id, inputValue, onContentChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleConfirm();
    if (e.key === 'Escape') { setEditing(false); setInputValue(''); }
  }, [handleConfirm]);

  // ── No URL yet — show placeholder prompt ──────────────────────────────────
  if (!embedSrc) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          background: '#f9fafb',
          border: '1.5px dashed #d1d5db',
          borderRadius: '6px',
        }}
        onDoubleClick={() => setEditing(true)}
      >
        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '90%', alignItems: 'center' }}>
            <input
              autoFocus
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Dán YouTube URL vào đây..."
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '5px',
                fontSize: '13px',
                outline: 'none',
                color: '#111827',
                fontFamily: 'inherit',
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); handleConfirm(); }}
                style={{
                  padding: '6px 16px',
                  background: '#111827',
                  border: 'none',
                  borderRadius: '5px',
                  color: '#fff',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Xác nhận
              </button>
              <button type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); setEditing(false); setInputValue(''); }}
                style={{
                  padding: '6px 16px',
                  background: '#f3f4f6',
                  border: '1px solid #e5e7eb',
                  borderRadius: '5px',
                  color: '#374151',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Huỷ
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* YouTube play icon */}
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.35 }}>
              <path d="M21.8 8.001a2.75 2.75 0 0 0-1.936-1.946C18.05 5.6 12 5.6 12 5.6s-6.05 0-7.864.455A2.75 2.75 0 0 0 2.2 8.001 28.8 28.8 0 0 0 1.75 12a28.8 28.8 0 0 0 .45 3.999 2.75 2.75 0 0 0 1.936 1.946C5.95 18.4 12 18.4 12 18.4s6.05 0 7.864-.455a2.75 2.75 0 0 0 1.936-1.946A28.8 28.8 0 0 0 22.25 12a28.8 28.8 0 0 0-.45-3.999Z" fill="#111827"/>
              <path d="M9.75 15.02 15.5 12l-5.75-3.02v6.04Z" fill="white"/>
            </svg>
            <div style={{ fontSize: '13px', color: '#6b7280', textAlign: 'center', lineHeight: 1.5 }}>
              Double-click để nhập<br />URL YouTube
            </div>
          </>
        )}
      </div>
    );
  }

  // ── Has URL — render iframe ────────────────────────────────────────────────
  return (
    <div
      style={{ width: '100%', height: '100%', position: 'relative', borderRadius: '4px', overflow: 'hidden' }}
      onDoubleClick={() => setEditing(true)}
    >
      <iframe
        src={embedSrc}
        title="YouTube video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
        // Block pointer events when selected so we can still drag the block
        // (pointer events are restored when user actually double-clicks to edit)
        loading="lazy"
      />
      {/* Transparent overlay to capture clicks/drags when selected */}
      {!editing && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'transparent',
            cursor: 'move',
          }}
          onDoubleClick={() => setEditing(true)}
        />
      )}
      {/* URL edit dialog overlay */}
      {editing && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          zIndex: 10,
        }}>
          <p style={{ fontSize: '13px', color: '#374151', margin: 0 }}>Nhập URL YouTube mới:</p>
          <input
            autoFocus
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="https://youtube.com/watch?v=..."
            style={{
              width: '80%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '5px',
              fontSize: '13px',
              outline: 'none',
              fontFamily: 'inherit',
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); handleConfirm(); }}
              style={{ padding: '6px 16px', background: '#111827', border: 'none', borderRadius: '5px', color: '#fff', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Cập nhật
            </button>
            <button type="button"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); setEditing(false); setInputValue(''); }}
              style={{ padding: '6px 16px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '5px', color: '#374151', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Huỷ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
