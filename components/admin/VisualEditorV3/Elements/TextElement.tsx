'use client';

import { useRef, useEffect, useCallback } from 'react';
import type { CanvasElement } from '../types';

interface TextElementProps {
  element: CanvasElement;
  isSelected: boolean;
  isEditing: boolean;
  onContentChange: (id: string, content: string) => void;
  onStartEdit: (id: string) => void;
  /** Called when the rendered text height exceeds the saved element height. */
  onHeightChange?: (id: string, height: number) => void;
}

export function TextElement({
  element,
  isSelected,
  isEditing,
  onContentChange,
  onStartEdit,
  onHeightChange,
}: TextElementProps) {
  const editRef = useRef<HTMLDivElement>(null);

  // Auto-grow: measure actual rendered height and notify parent if text needs more space.
  // Only grows — never shrinks — so manually-cropped elements stay as-is.
  // We depend on element.height to stop re-firing once the state has caught up.
  const reportHeight = useCallback(() => {
    if (editRef.current && onHeightChange) {
      const rendered = editRef.current.scrollHeight;
      if (rendered > element.height) {
        onHeightChange(element.id, rendered);
      }
    }
  }, [element.id, element.height, onHeightChange]);

  // Sync content from props into the DOM only when not editing,
  // then immediately measure height so the element auto-grows if needed.
  useEffect(() => {
    if (!isEditing && editRef.current) {
      if (editRef.current.innerHTML !== element.content) {
        editRef.current.innerHTML = element.content;
      }
      // Measure after DOM update
      reportHeight();
    }
  }, [element.content, isEditing, reportHeight]);

  // Focus when entering edit mode
  useEffect(() => {
    if (isEditing && editRef.current) {
      editRef.current.focus();
      // Move caret to end
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(editRef.current);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [isEditing]);

  const syncContent = useCallback(() => {
    if (editRef.current) {
      onContentChange(element.id, editRef.current.innerHTML);
      // Also auto-grow while user is typing
      reportHeight();
    }
  }, [element.id, onContentChange, reportHeight]);

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onStartEdit(element.id);
    },
    [element.id, onStartEdit]
  );

  // Keyboard shortcuts: Ctrl+B/I/U while editing
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isEditing) return;
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key === 'b') { e.preventDefault(); document.execCommand('bold'); syncContent(); }
      if (ctrl && e.key === 'i') { e.preventDefault(); document.execCommand('italic'); syncContent(); }
      if (ctrl && e.key === 'u') { e.preventDefault(); document.execCommand('underline'); syncContent(); }
    },
    [isEditing, syncContent]
  );

  const style: React.CSSProperties = {
    fontFamily: element.style.fontFamily || 'inherit',
    fontSize: element.style.fontSize ? `${element.style.fontSize}px` : '16px',
    fontWeight: element.style.fontWeight || 'normal',
    fontStyle: element.style.fontStyle || 'normal',
    textDecoration: element.style.textDecoration || 'none',
    textAlign: (element.style.textAlign as React.CSSProperties['textAlign']) || 'left',
    lineHeight: element.style.lineHeight || 1.6,
    letterSpacing: element.style.letterSpacing ? `${element.style.letterSpacing}em` : 'normal',
    color: element.style.color || '#000000',
    backgroundColor: element.style.backgroundColor || 'transparent',
    opacity: element.style.opacity ?? 1,
    padding: element.style.padding ? `${element.style.padding}px` : '8px',
    width: '100%',
    minHeight: '1em',
    outline: 'none',
    cursor: isEditing ? 'text' : 'default',
    wordBreak: 'break-word',
    whiteSpace: 'pre-wrap',
    userSelect: isEditing ? 'text' : 'none',
  };

  return (
    <div
      ref={editRef}
      contentEditable={isEditing}
      suppressContentEditableWarning
      onInput={syncContent}
      onKeyDown={handleKeyDown}
      onDoubleClick={handleDoubleClick}
      style={style}
      data-element-id={element.id}
      data-element-type="text"
    />
  );
}
