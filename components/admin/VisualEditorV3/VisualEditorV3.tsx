'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import styles from './VisualEditorV3.module.css';
import type { CanvasElement, ElementStyle, ElementType, HeadingLevel, VisualEditorV3Props } from './types';
import { useCanvasState } from './hooks/useCanvasState';
import { useKeyboard } from './hooks/useKeyboard';
import { deserializeOrEmpty } from './utils/deserializeCanvas';
import { serializeCanvas } from './utils/serializeCanvas';
import { stripInlineStyles } from './utils/stripInlineStyles';
import { Canvas } from './Canvas/Canvas';
import { TopToolbar } from './Toolbar/TopToolbar';
import { FloatingToolbar } from './Toolbar/FloatingToolbar';
import { Inspector } from './Inspector/Inspector';

// -------------------------------------------------------
// Default element sizes/positions
// -------------------------------------------------------
const ELEMENT_DEFAULTS: Record<ElementType, { width: number; height: number }> = {
  text: { width: 400, height: 80 },
  heading: { width: 600, height: 80 },
  image: { width: 400, height: 300 },
  divider: { width: 600, height: 40 },
  embed: { width: 560, height: 315 },   // 16:9 default
};

// Starting position offset to avoid stacking when multiple blocks added in a row
let placementCounter = 0;
function getNextPosition(scrollTop: number, canvasWidth: number) {
  const col = placementCounter % 3;
  const row = Math.floor(placementCounter / 3);
  placementCounter++;
  return {
    x: 60 + col * 200,
    // Place near the top of the current visible area (scrollTop) with some padding
    y: Math.round(scrollTop) + 40 + row * 120,
  };
}

// -------------------------------------------------------
// Main Component
// -------------------------------------------------------
export function VisualEditorV3({ value, onChange, readOnly = false }: VisualEditorV3Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [floatingToolbarPos, setFloatingToolbarPos] = useState({ x: 0, y: 0 });
  const [showFloating, setShowFloating] = useState(false);
  const onChangePendingRef = useRef(false);
  const editingElRef = useRef<HTMLElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const t = useTranslations('Admin.VisualEditor');

  // ---- Initialize state from serialized value ----
  const initialState = deserializeOrEmpty(value);
  const editor = useCanvasState(initialState);
  const { state, addElement, updateElement, updateElementStyle, deleteSelected,
    selectElement, clearSelection, selectedElements, moveElements, commitMove,
    resizeElement, duplicateSelected, loadState, undo, redo, canUndo, canRedo,
    dispatch } = editor;

  // Load new value from outside (e.g., when form resets)
  const lastValueRef = useRef(value);
  useEffect(() => {
    if (value !== lastValueRef.current) {
      lastValueRef.current = value;
      const newState = deserializeOrEmpty(value);
      loadState(newState);
      placementCounter = 0;
    }
  }, [value, loadState]);

  // ---- Auto-serialize on state change ----
  useEffect(() => {
    const serialized = serializeCanvas(state);
    if (serialized !== lastValueRef.current) {
      lastValueRef.current = serialized;
      onChange(serialized);
    }
  }, [state, onChange]);

  // ---- Floating toolbar position ----
  useEffect(() => {
    if (selectedElements.length === 0) {
      setShowFloating(false);
      return;
    }
    // Position toolbar near top of first selected element
    // Use canvas element's bounding rect
    const el = selectedElements[0];
    const canvasEl = document.querySelector(`[data-element-id="${el.id}"]`);
    if (canvasEl) {
      const rect = canvasEl.getBoundingClientRect();
      // Use horizontal center of the element so the toolbar centers above it
      setFloatingToolbarPos({
        x: rect.left + rect.width / 2,
        y: rect.top,
      });
      setShowFloating(true);
    }
  }, [selectedElements, state.elements]);

  // ---- Add element ----
  const handleAddElement = useCallback(
    (type: ElementType, extra?: Record<string, unknown>) => {
      const defaults = ELEMENT_DEFAULTS[type] || { width: 300, height: 100 };
      // Use current scroll position so new block appears in visible area
      const scrollTop = scrollContainerRef.current?.scrollTop ?? 0;
      const pos = getNextPosition(scrollTop, state.canvasWidth);
      placementCounter = 0; // reset after each add so next block doesn't drift too far
      const defaultContent =
        type === 'text' ? `<p>${t('defaultContent.text')}</p>`
        : type === 'heading' ? t('defaultContent.heading')
        : type === 'divider' ? ''
        : '';

      addElement({
        type,
        x: pos.x,
        y: pos.y,
        width: defaults.width,
        height: defaults.height,
        content: defaultContent,
        style: {
          fontSize: type === 'text' ? 16 : type === 'heading' ? 36 : undefined,
          fontWeight: type === 'heading' ? 'bold' : 'normal',
          color: '#1e293b',
        },
        headingLevel: type === 'heading' ? ((extra?.headingLevel as HeadingLevel) ?? 1) : undefined,
        ...(extra || {}),
      } as Omit<CanvasElement, 'id' | 'zIndex'>);
    },
    [addElement, state.canvasWidth]
  );

  // ---- Keyboard shortcuts ----
  useKeyboard({
    enabled: !readOnly,
    onDelete: deleteSelected,
    onUndo: undo,
    onRedo: redo,
    onDuplicate: duplicateSelected,
    onEscape: () => {
      if (editingId) setEditingId(null);
      else clearSelection();
    },
    onSelectAll: () => {
      const allIds = state.elements.map((el) => el.id);
      dispatch({ type: 'SELECT_ELEMENTS', payload: allIds });
    },
  });

  // ---- Canvas background ----
  const handleBackgroundChange = useCallback(
    (color: string) => {
      dispatch({ type: 'SET_CANVAS', payload: { background: color } });
    },
    [dispatch]
  );

  // Keep state.canvasWidth in sync with actual board pixel width
  const handleCanvasWidthChange = useCallback(
    (width: number) => {
      if (Math.abs(width - state.canvasWidth) > 2) {
        dispatch({ type: 'SET_CANVAS', payload: { canvasWidth: width } });
      }
    },
    [dispatch, state.canvasWidth]
  );

  // ---- Handlers ----
  const handleSelectElement = useCallback(
    (id: string, add: boolean) => {
      selectElement(id, add);
    },
    [selectElement]
  );

  const handleSelectMultiple = useCallback(
    (ids: string[]) => {
      dispatch({ type: 'SELECT_ELEMENTS', payload: ids });
    },
    [dispatch]
  );

  const handleStartEdit = useCallback((id: string) => {
    if (readOnly) return;
    setEditingId(id);
    // Capture the contentEditable DOM node for inline formatting
    requestAnimationFrame(() => {
      const node = document.querySelector<HTMLElement>(
        `[data-element-id="${id}"][contenteditable], [data-element-id="${id}"] [contenteditable]`
      );
      editingElRef.current = node;
    });
  }, [readOnly]);

  const handleStopEdit = useCallback(() => {
    setEditingId(null);
    editingElRef.current = null;
  }, []);

  // Sync inline-formatted innerHTML back to state
  const handleInlineFormatApplied = useCallback(() => {
    const node = editingElRef.current;
    if (!node || !editingId) return;
    dispatch({ type: 'UPDATE_ELEMENT', payload: { id: editingId, content: node.innerHTML } });
  }, [editingId, dispatch]);

  const handleContentChange = useCallback(
    (id: string, content: string) => {
      // Use direct update without history push for every keystroke
      dispatch({ type: 'UPDATE_ELEMENT', payload: { id, content } });
    },
    [dispatch]
  );

  const handleDeleteElement = useCallback(
    (id: string) => {
      dispatch({ type: 'DELETE_ELEMENTS', payload: [id] });
    },
    [dispatch]
  );

  const handleReorderElement = useCallback(
    (id: string, direction: 'up' | 'down' | 'top' | 'bottom') => {
      dispatch({ type: 'REORDER_ELEMENT', payload: { id, direction } });
    },
    [dispatch]
  );

  const handleLockElement = useCallback(
    (id: string, locked: boolean) => {
      dispatch({ type: 'LOCK_ELEMENT', payload: { id, locked } });
    },
    [dispatch]
  );

  /**
   * Block-style change wrapper.
   * When a block-level style property changes, any inline styles on descendant
   * elements (applied via execCommand) for the same property are stripped so
   * the block style wins (higher conceptual priority).
   */
  const handleStyleChange = useCallback(
    (id: string, newStyle: Partial<ElementStyle>) => {
      // Strip conflicting inline styles from content first
      const element = state.elements.find((el) => el.id === id);
      if (element && (element.type === 'text' || element.type === 'heading') && element.content) {
        const keys = Object.keys(newStyle) as (keyof ElementStyle)[];
        const stripped = stripInlineStyles(element.content, keys);
        if (stripped !== element.content) {
          // Update content (strip) then style in one batch
          dispatch({ type: 'UPDATE_ELEMENT', payload: { id, content: stripped } });
        }
      }
      updateElementStyle(id, newStyle);
    },
    [state.elements, updateElementStyle, dispatch]
  );

  const handleSave = useCallback(() => {
    // The onChange is called automatically on every state change.
    // This button is just a UX affordance; the parent form handles the actual save.
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 800);
  }, []);

  return (
    // Stop any click / submit that originates inside the editor from
    // bubbling up to a parent <form>, which would cause accidental submission
    // when the user finishes a drag and the mouseup lands on a toolbar button.
    <div
      className={styles.editorRoot}
      onClick={(e) => {
        // Stop bubble so clicks inside the editor never reach the parent <form>
        // and accidentally trigger form submission.
        // (capture phase would block children — bubble phase is correct here)
        e.stopPropagation();
      }}
    >
      {/* Top toolbar */}
      {!readOnly && (
        <TopToolbar
          canUndo={canUndo()}
          canRedo={canRedo()}
          hasSelection={state.selectedIds.length > 0}
          onUndo={undo}
          onRedo={redo}
          onAddElement={handleAddElement}
          onDeleteSelected={deleteSelected}
          onDuplicateSelected={duplicateSelected}
          canvasBackground={state.background}
          onBackgroundChange={handleBackgroundChange}
        />
      )}

      {/* Editor body — canvas fills full width */}
      <div className={styles.editorBody} style={{ position: 'relative' }}>
        <Canvas
          state={state}
          editingId={editingId}
          onSelectElement={handleSelectElement}
          onSelectMultiple={handleSelectMultiple}
          onClearSelection={clearSelection}
          onMoveElements={moveElements}
          onCommitMove={commitMove}
          onResizeElement={resizeElement}
          onContentChange={handleContentChange}
          onStartEdit={handleStartEdit}
          onStopEdit={handleStopEdit}
          onCanvasWidthChange={handleCanvasWidthChange}
          scrollContainerRef={scrollContainerRef}
        />
      </div>

      {/* Floating Inspector — sibling of editorBody, floats over everything */}
      {!readOnly && (
        <Inspector
          selectedElements={selectedElements}
          onUpdateElement={updateElement}
          onUpdateStyle={handleStyleChange}
          onReorderElement={handleReorderElement}
          onLockElement={handleLockElement}
          onDeleteElement={handleDeleteElement}
        />
      )}

      {/* Floating toolbar — visible when block selected OR in edit mode */}
      {!readOnly && (
        <FloatingToolbar
          selectedElements={selectedElements}
          onStyleChange={handleStyleChange}
          visible={showFloating && selectedElements.length > 0}
          anchorX={floatingToolbarPos.x}
          anchorY={floatingToolbarPos.y}
          editingRef={editingElRef}
          isEditing={editingId !== null}
          onInlineFormatApplied={handleInlineFormatApplied}
        />
      )}
    </div>
  );
}
