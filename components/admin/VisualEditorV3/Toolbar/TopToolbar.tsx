'use client';

import { useTranslations } from 'next-intl';
import {
  Type, Heading1, Image, Minus, Undo2, Redo2,
  Copy, Trash2, Youtube,
} from 'lucide-react';
import type { ElementType, HeadingLevel } from '../types';

interface TopToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  hasSelection: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onAddElement: (type: ElementType, extra?: Record<string, unknown>) => void;
  onDeleteSelected: () => void;
  onDuplicateSelected: () => void;
  canvasBackground: string;
  onBackgroundChange: (color: string) => void;
}

// ─── Shared design tokens ──────────────────────────────────────────────────
const BASE: React.CSSProperties = {
  fontFamily: 'inherit',
  fontSize: '13px',
  cursor: 'pointer',
  transition: 'background 0.12s, color 0.12s, border-color 0.12s',
  whiteSpace: 'nowrap',
};

const addBtnStyle: React.CSSProperties = {
  ...BASE,
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
  padding: '5px 12px',
  borderRadius: '5px',
  border: '1px solid #e5e7eb',
  background: '#fff',
  color: '#374151',
  fontWeight: 500,
};

const iconBtnStyle: React.CSSProperties = {
  ...BASE,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 32,
  height: 32,
  borderRadius: '5px',
  border: '1px solid #e5e7eb',
  background: '#fff',
  color: '#374151',
};

const divider = (
  <div style={{ width: 1, height: 20, background: '#e5e7eb', margin: '0 2px', flexShrink: 0 }} />
);

export function TopToolbar({
  canUndo,
  canRedo,
  hasSelection,
  onUndo,
  onRedo,
  onAddElement,
  onDeleteSelected,
  onDuplicateSelected,
  canvasBackground,
  onBackgroundChange,
}: TopToolbarProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '8px 16px',
        background: '#fff',
        borderBottom: '1px solid #e5e7eb',
        flexWrap: 'wrap',
      }}
    >
      {/* Add label */}
      <span style={{
        fontSize: '11px',
        color: '#9ca3af',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginRight: '2px',
      }}>
        Thêm
      </span>

      <button type="button" style={addBtnStyle} onClick={() => onAddElement('text')} title="Thêm text">
        <Type size={12} />
        Text
      </button>

      <button type="button" style={addBtnStyle} onClick={() => onAddElement('heading', { headingLevel: 1 as HeadingLevel })} title="Thêm tiêu đề">
        <Heading1 size={12} />
        Tiêu đề
      </button>

      <button type="button" style={addBtnStyle} onClick={() => onAddElement('image')} title="Thêm ảnh">
        <Image size={12} />
        Ảnh
      </button>

      <button type="button" style={addBtnStyle} onClick={() => onAddElement('divider')} title="Thêm divider">
        <Minus size={12} />
        Divider
      </button>

      <button type="button" style={addBtnStyle} onClick={() => onAddElement('embed')} title="Nhúng video YouTube">
        <Youtube size={12} />
        Video
      </button>

      {divider}

      {/* History */}
      <button
        type="button"
        style={{ ...iconBtnStyle, opacity: canUndo ? 1 : 0.35, cursor: canUndo ? 'pointer' : 'not-allowed' }}
        onClick={onUndo}
        disabled={!canUndo}
        title="Undo (Ctrl+Z)"
      >
        <Undo2 size={14} />
      </button>
      <button
        type="button"
        style={{ ...iconBtnStyle, opacity: canRedo ? 1 : 0.35, cursor: canRedo ? 'pointer' : 'not-allowed' }}
        onClick={onRedo}
        disabled={!canRedo}
        title="Redo (Ctrl+Y)"
      >
        <Redo2 size={14} />
      </button>

      {divider}

      {/* Selection actions */}
      <button
        type="button"
        style={{ ...iconBtnStyle, opacity: hasSelection ? 1 : 0.35, cursor: hasSelection ? 'pointer' : 'not-allowed' }}
        onClick={onDuplicateSelected}
        disabled={!hasSelection}
        title="Nhân đôi (Ctrl+D)"
      >
        <Copy size={14} />
      </button>
      <button
        type="button"
        style={{
          ...iconBtnStyle,
          opacity: hasSelection ? 1 : 0.35,
          cursor: hasSelection ? 'pointer' : 'not-allowed',
          color: hasSelection ? '#ef4444' : '#374151',
          borderColor: hasSelection ? '#fecaca' : '#e5e7eb',
        }}
        onClick={onDeleteSelected}
        disabled={!hasSelection}
        title="Xóa (Delete)"
      >
        <Trash2 size={14} />
      </button>

      {divider}

      {/* Canvas background color */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Nền
        </span>
        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }} title="Canvas background">
          <div style={{
            width: 20,
            height: 20,
            borderRadius: '4px',
            background: canvasBackground,
            border: '1px solid #d1d5db',
            flexShrink: 0,
          }} />
          <input
            type="color"
            value={canvasBackground}
            onChange={(e) => onBackgroundChange(e.target.value)}
            style={{ opacity: 0, position: 'absolute', pointerEvents: 'none', width: 0, height: 0 }}
          />
        </label>
      </div>

    </div>
  );
}
