'use client';

import { useRef, useEffect, useCallback } from 'react';
import type { CanvasElement, HeadingLevel } from '../types';

interface HeadingElementProps {
  element: CanvasElement;
  isEditing: boolean;
  onContentChange: (id: string, content: string) => void;
  onStartEdit: (id: string) => void;
}

const defaultFontSizes: Record<HeadingLevel, number> = {
  1: 48,
  2: 36,
  3: 28,
  4: 22,
};

export function HeadingElement({
  element,
  isEditing,
  onContentChange,
  onStartEdit,
}: HeadingElementProps) {
  const editRef = useRef<HTMLHeadingElement>(null);
  const level = (element.headingLevel ?? 1) as HeadingLevel;

  useEffect(() => {
    if (!isEditing && editRef.current) {
      if (editRef.current.innerHTML !== element.content) {
        editRef.current.innerHTML = element.content;
      }
    }
  }, [element.content, isEditing]);

  useEffect(() => {
    if (isEditing && editRef.current) {
      editRef.current.focus();
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
    }
  }, [element.id, onContentChange]);

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onStartEdit(element.id);
    },
    [element.id, onStartEdit]
  );

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

  const commonStyle: React.CSSProperties = {
    fontFamily: element.style.fontFamily || 'inherit',
    fontSize: element.style.fontSize
      ? `${element.style.fontSize}px`
      : `${defaultFontSizes[level]}px`,
    fontWeight: element.style.fontWeight || 'bold',
    fontStyle: element.style.fontStyle || 'normal',
    textAlign: (element.style.textAlign as React.CSSProperties['textAlign']) || 'left',
    lineHeight: element.style.lineHeight || 1.2,
    letterSpacing: element.style.letterSpacing ? `${element.style.letterSpacing}em` : 'normal',
    color: element.style.color || '#000000',
    backgroundColor: element.style.backgroundColor || 'transparent',
    padding: element.style.padding ? `${element.style.padding}px` : '4px 8px',
    margin: 0,
    width: '100%',
    outline: 'none',
    cursor: isEditing ? 'text' : 'default',
    wordBreak: 'break-word',
    userSelect: isEditing ? 'text' : 'none',
  };

  const sharedProps = {
    ref: editRef,
    contentEditable: isEditing,
    suppressContentEditableWarning: true as const,
    onInput: syncContent,
    onKeyDown: handleKeyDown,
    onDoubleClick: handleDoubleClick,
    style: commonStyle,
    'data-element-id': element.id,
    'data-element-type': 'heading',
  };

  return (
    <>
      {level === 2 ? <h2 {...sharedProps} /> :
       level === 3 ? <h3 {...sharedProps} /> :
       level === 4 ? <h4 {...sharedProps} /> :
       <h1 {...sharedProps} />}
    </>
  );
}
