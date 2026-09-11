'use client';

import { useCallback, useRef } from 'react';
import type { CanvasElement, ResizeHandle } from '../types';
import { TextElement } from '../Elements/TextElement';
import { HeadingElement } from '../Elements/HeadingElement';
import { ImageElement } from '../Elements/ImageElement';
import { DividerElement } from '../Elements/DividerElement';
import { VideoElement } from '../Elements/VideoElement';

// Resize handles config
const HANDLES: Array<{ id: ResizeHandle; cursor: string; style: React.CSSProperties }> = [
  { id: 'nw', cursor: 'nw-resize', style: { top: -5, left: -5 } },
  { id: 'n',  cursor: 'n-resize',  style: { top: -5, left: '50%', transform: 'translateX(-50%)' } },
  { id: 'ne', cursor: 'ne-resize', style: { top: -5, right: -5 } },
  { id: 'w',  cursor: 'w-resize',  style: { top: '50%', left: -5, transform: 'translateY(-50%)' } },
  { id: 'e',  cursor: 'e-resize',  style: { top: '50%', right: -5, transform: 'translateY(-50%)' } },
  { id: 'sw', cursor: 'sw-resize', style: { bottom: -5, left: -5 } },
  { id: 's',  cursor: 's-resize',  style: { bottom: -5, left: '50%', transform: 'translateX(-50%)' } },
  { id: 'se', cursor: 'se-resize', style: { bottom: -5, right: -5 } },
];

// Minimum pixel movement to classify as a drag (not a click)
const DRAG_THRESHOLD = 4;

interface CanvasElementProps {
  element: CanvasElement;
  isSelected: boolean;
  isEditing: boolean;
  onSelect: (id: string, addToSelection: boolean) => void;
  onMoveStart: (e: React.MouseEvent, ids: string[]) => void;
  onMoveElements: (ids: string[], dx: number, dy: number) => void;
  onCommitMove: (ids: string[], dx: number, dy: number) => void;
  onResizeStart: (e: React.MouseEvent, handle: ResizeHandle, id: string, rect: { x: number; y: number; width: number; height: number }) => void;
  onContentChange: (id: string, content: string) => void;
  onStartEdit: (id: string) => void;
  onStopEdit: () => void;
  selectedIds: string[];
}

export function CanvasElementWrapper({
  element,
  isSelected,
  isEditing,
  onSelect,
  onMoveStart,
  onMoveElements,
  onCommitMove,
  onResizeStart,
  onContentChange,
  onStartEdit,
  onStopEdit,
  selectedIds,
}: CanvasElementProps) {
  // Track mousedown position to distinguish drag from click
  const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Always record start position (needed by handleClickCapture to detect drag vs click)
      mouseDownPosRef.current = { x: e.clientX, y: e.clientY };

      if (isEditing) {
        // In edit mode: ensure element stays selected in state but let
        // contentEditable handle the actual cursor/selection internally
        onSelect(element.id, false);
        return;
      }

      // If another element is currently being edited, exit its edit mode first.
      // Without this, editingId stays pointing at the old element, so clicking
      // back on that element later incorrectly falls into the `isEditing` branch
      // and fails to re-select it properly.
      onStopEdit();

      e.stopPropagation();

      // Locked elements can be selected (to show Inspector / unlock), but cannot be moved
      onSelect(element.id, e.shiftKey || e.ctrlKey || e.metaKey);
      if (element.locked) return;

      const idsToMove = selectedIds.includes(element.id) ? selectedIds : [element.id];
      onMoveStart(e, idsToMove);
    },
    [element.id, element.locked, isEditing, onSelect, onMoveStart, onStopEdit, selectedIds]
  );

  /**
   * Use CAPTURE phase so this handler runs BEFORE children.
   * When NOT editing: if the mouse moved > DRAG_THRESHOLD it was a drag — kill
   * the click so ImageElement's file input etc. never open.
   * When editing: always pass through (contentEditable + toolbar handle clicks).
   */
  const handleClickCapture = useCallback(
    (e: React.MouseEvent) => {
      const start = mouseDownPosRef.current;
      mouseDownPosRef.current = null;

      // In edit mode, never block clicks
      if (isEditing) return;

      if (!start) return;
      const dx = Math.abs(e.clientX - start.x);
      const dy = Math.abs(e.clientY - start.y);
      if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
        // Was a drag — kill the event before any child sees it
        e.stopPropagation();
        e.preventDefault();
      }
    },
    [isEditing]
  );

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, handle: ResizeHandle) => {
      e.preventDefault();
      e.stopPropagation();
      onResizeStart(e, handle, element.id, {
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
      });
    },
    [element, onResizeStart]
  );

  const wrapperStyle: React.CSSProperties = {
    position: 'absolute',
    left: element.x,
    top: element.y,
    width: element.width,
    height: element.height,
    zIndex: element.zIndex,
    cursor: isEditing ? 'text' : element.locked ? 'pointer' : 'move',
    boxSizing: 'border-box',
    userSelect: 'none',
  };

  const renderContent = () => {
    switch (element.type) {
      case 'text':
        return (
          <TextElement
            element={element}
            isSelected={isSelected}
            isEditing={isEditing}
            onContentChange={onContentChange}
            onStartEdit={onStartEdit}
          />
        );
      case 'heading':
        return (
          <HeadingElement
            element={element}
            isEditing={isEditing}
            onContentChange={onContentChange}
            onStartEdit={onStartEdit}
          />
        );
      case 'image':
        return (
          <ImageElement
            element={element}
            isSelected={isSelected}
            onContentChange={onContentChange}
          />
        );
      case 'divider':
        return <DividerElement element={element} />;
      case 'embed':
        return (
          <VideoElement
            element={element}
            isSelected={isSelected}
            onContentChange={onContentChange}
          />
        );
      default:
        return null;

    }
  };

  return (
    <div
      style={wrapperStyle}
      onMouseDown={handleMouseDown}
      onClickCapture={handleClickCapture}
      data-element-id={element.id}
    >
      {renderContent()}

      {/* Selection ring overlay — sits above all content including images */}
      {isSelected && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            border: `2px solid ${element.locked ? '#f59e0b' : '#111827'}`,
            borderRadius: 'inherit',
            pointerEvents: 'none',
            zIndex: 9999,
          }}
        />
      )}

      {/* Resize handles — only show when selected and not editing */}
      {isSelected && !isEditing && !element.locked && HANDLES.map((handle) => (
        <div
          key={handle.id}
          onMouseDown={(e) => handleResizeStart(e, handle.id)}
          style={{
            position: 'absolute',
            width: 8,
            height: 8,
            background: '#111827',
            border: '2px solid #fff',
            borderRadius: '50%',
            cursor: handle.cursor,
            zIndex: 10001,
            boxSizing: 'border-box',
            ...handle.style,
          }}
        />
      ))}

      {/* Lock indicator */}
      {element.locked && (
        <div
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            fontSize: '10px',
            background: 'rgba(245,158,11,0.85)',
            color: '#fff',
            borderRadius: '4px',
            padding: '2px 6px',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            fontWeight: 600,
            fontFamily: 'system-ui, sans-serif',
            backdropFilter: 'blur(4px)',
          }}
        >
          🔒 {isSelected ? 'Mở khóa trong Inspector →' : ''}
        </div>
      )}
    </div>
  );
}
