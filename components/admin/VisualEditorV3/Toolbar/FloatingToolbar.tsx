'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Strikethrough, RemoveFormatting,
} from 'lucide-react';
import type { CanvasElement, ElementStyle } from '../types';

interface FloatingToolbarProps {
  selectedElements: CanvasElement[];
  onStyleChange: (id: string, style: Partial<ElementStyle>) => void;
  visible: boolean;
  anchorX: number;
  anchorY: number;
  /** The currently-editing element's contentEditable ref (for inline formatting) */
  editingRef?: React.RefObject<HTMLElement | null>;
  /** Whether an element is in edit/typing mode */
  isEditing?: boolean;
  /** Called after execCommand so the parent can sync innerHTML */
  onInlineFormatApplied?: () => void;
}

// -------------------------------------------------------
// Constants
// -------------------------------------------------------
const FONT_FAMILIES = [
  'inherit', 'Inter', 'Arial', 'Georgia', 'Times New Roman',
  'Roboto', 'Playfair Display', 'Montserrat', 'Lato', 'Raleway',
];

const FONT_SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 60, 72];

// -------------------------------------------------------
// Helpers
// -------------------------------------------------------
function getActiveInlineFormats(): Record<string, boolean> {
  try {
    return {
      bold:        document.queryCommandState('bold'),
      italic:      document.queryCommandState('italic'),
      underline:   document.queryCommandState('underline'),
      strikethrough: document.queryCommandState('strikethrough'),
      superscript: document.queryCommandState('superscript'),
      subscript:   document.queryCommandState('subscript'),
    };
  } catch {
    return {};
  }
}

function hasNonCollapsedSelection(container: HTMLElement | null): boolean {
  if (!container) return false;
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || sel.rangeCount === 0) return false;
  const range = sel.getRangeAt(0);
  return container.contains(range.commonAncestorContainer);
}

/**
 * Tracks a color with local state (instant preview) and debounces the
 * expensive commit (state dispatch / execCommand) by `delay` ms.
 */
function useDebouncedColor(
  externalValue: string,
  onCommit: (color: string) => void,
  delay = 80,
) {
  const [local, setLocal] = useState(externalValue);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep in sync when element selection changes
  useEffect(() => { setLocal(externalValue); }, [externalValue]);

  const handleChange = useCallback((color: string) => {
    setLocal(color);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onCommit(color), delay);
  }, [onCommit, delay]);

  const handleBlur = useCallback(() => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    onCommit(local);
  }, [onCommit, local]);

  return { local, handleChange, handleBlur };
}

// -------------------------------------------------------
// Main Component
// -------------------------------------------------------
export function FloatingToolbar({
  selectedElements,
  onStyleChange,
  visible,
  anchorX,
  anchorY,
  editingRef,
  isEditing = false,
  onInlineFormatApplied,
}: FloatingToolbarProps) {
  const tf = useTranslations('Admin.VisualEditor.toolbar.format');
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [hasSelection, setHasSelection] = useState(false);
  const [inlineActive, setInlineActive] = useState<Record<string, boolean>>({});

  // --- Debounced colors ---
  const commitTextColor = useCallback((color: string) => {
    if (isEditing) {
      editingRef?.current?.focus();
      document.execCommand('foreColor', false, color);
      onInlineFormatApplied?.();
    } else {
      selectedElements.forEach((el) => onStyleChange(el.id, { color }));
    }
  }, [isEditing, editingRef, onInlineFormatApplied, selectedElements, onStyleChange]);

  const commitBgColor = useCallback((color: string) => {
    if (isEditing) {
      editingRef?.current?.focus();
      document.execCommand('backColor', false, color);
      onInlineFormatApplied?.();
    } else {
      selectedElements.forEach((el) => onStyleChange(el.id, { backgroundColor: color }));
    }
  }, [isEditing, editingRef, onInlineFormatApplied, selectedElements, onStyleChange]);

  const el0 = selectedElements[0];
  const style0 = el0?.style ?? {};
  const textColorDebounce = useDebouncedColor(style0.color || '#000000', commitTextColor);
  const bgColorDebounce = useDebouncedColor(style0.backgroundColor || '#ffff00', commitBgColor);

  // Track text selection inside editingRef
  useEffect(() => {
    if (!isEditing) {
      setHasSelection(false);
      return;
    }
    const onSelChange = () => {
      const has = hasNonCollapsedSelection(editingRef?.current ?? null);
      setHasSelection(has);
      if (has) setInlineActive(getActiveInlineFormats());
    };
    document.addEventListener('selectionchange', onSelChange);
    return () => document.removeEventListener('selectionchange', onSelChange);
  }, [isEditing, editingRef]);

  const applyInline = useCallback(
    (cmd: string) => {
      editingRef?.current?.focus();
      document.execCommand(cmd, false);
      setInlineActive(getActiveInlineFormats());
      onInlineFormatApplied?.();
    },
    [editingRef, onInlineFormatApplied]
  );

  // â”€â”€ Inline span wrapping (for font-family, font-size, opacity) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Browser loses text selection when user clicks dropdowns/sliders.
  // We save the range on mousedown and restore it before applying the style.
  const savedRangeRef = useRef<Range | null>(null);

  const saveSelection = useCallback(() => {
    const container = editingRef?.current;
    if (!container) return;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      const range = sel.getRangeAt(0);
      if (container.contains(range.commonAncestorContainer)) {
        savedRangeRef.current = range.cloneRange();
        return;
      }
    }
    // Keep previous saved range if we don't have a fresh one
  }, [editingRef]);

  /**
   * Restore saved selection then wrap it in a <span style="property: value">.
   * Falls back to block-level apply() if there's no saved selection.
   */
  const wrapSelectionWithStyle = useCallback(
    (cssProperty: string, cssValue: string, fallbackApply: () => void) => {
      const container = editingRef?.current;
      if (!container) { fallbackApply(); return; }

      container.focus();

      // Restore saved range
      const savedRange = savedRangeRef.current;
      if (savedRange) {
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(savedRange);
        savedRangeRef.current = null;
      }

      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
        // No selection â€” apply block-level
        fallbackApply();
        return;
      }

      const range = sel.getRangeAt(0);
      if (!container.contains(range.commonAncestorContainer)) {
        fallbackApply();
        return;
      }

      const span = document.createElement('span');
      // Convert camelCase â†’ kebab-case for setProperty
      const kebab = cssProperty.replace(/([A-Z])/g, (m) => `-${m.toLowerCase()}`);
      span.style.setProperty(kebab, cssValue);

      try {
        range.surroundContents(span);
      } catch {
        // surroundContents fails when selection crosses element boundaries
        const fragment = range.extractContents();
        span.appendChild(fragment);
        range.insertNode(span);
      }

      // Re-select the wrapped content
      const newRange = document.createRange();
      newRange.selectNodeContents(span);
      sel.removeAllRanges();
      sel.addRange(newRange);

      onInlineFormatApplied?.();
    },
    [editingRef, onInlineFormatApplied]
  );


  if (!visible || selectedElements.length === 0) return null;

  const el = selectedElements[0];
  const style = el.style;
  const isTextType = el.type === 'text' || el.type === 'heading';

  const apply = (s: Partial<ElementStyle>) => {
    selectedElements.forEach((e) => onStyleChange(e.id, s));
  };

  // -------------------------------------------------------
  // Style helpers
  // -------------------------------------------------------
  const btnBase: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    borderRadius: '5px',
    border: 'none',
    background: 'transparent',
    color: '#1e293b',
    cursor: 'pointer',
    fontSize: '13px',
    transition: 'background 0.1s',
  };

  const activeBtnStyle: React.CSSProperties = {
    background: '#f3f4f6',
    color: '#111827',
  };

  const inlineActiveBtnStyle: React.CSSProperties = {
    background: '#e5e7eb',
    color: '#111827',
    fontWeight: 700,
  };

  const divider = (
    <div style={{ width: 1, height: 20, background: '#e5e7eb', margin: '0 3px', flexShrink: 0 }} />
  );

  // -------------------------------------------------------
  // Render
  // -------------------------------------------------------
  return (
    <div
      ref={toolbarRef}
      onMouseDown={(e) => {
        // Stop propagation so canvas background's mousedown doesn't fire and
        // accidentally call onStopEdit while user is interacting with the toolbar.
        // Do NOT call preventDefault() here â€” that would cancel click events on
        // child buttons/dropdowns/selects, preventing them from opening.
        e.stopPropagation();
      }}
      style={{
        position: 'fixed',
        // anchorX = horizontal center of the selected element
        // translateX(-50%) centers the toolbar exactly above it
        left: Math.max(8, Math.min(anchorX, window.innerWidth - 16)),
        top: Math.max(8, anchorY - 46),
        transform: 'translateX(-50%)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        padding: '5px 8px',
        background: '#fff',
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)',
        border: '1px solid #e5e7eb',
        userSelect: 'none',
        flexWrap: 'nowrap',
        pointerEvents: 'all',
        maxWidth: 'calc(100vw - 16px)',
        overflowX: 'auto',
      }}
    >
      {isTextType && (
        <>
          {/* ——— Inline format section (shown when in edit mode) ———————— */}
          {isEditing && (
            <>
              {/* Bold inline */}
              <button type="button"
                title={tf('bold')}
                onMouseDown={(e) => { e.preventDefault(); applyInline('bold'); }}
                style={{ ...btnBase, ...(inlineActive.bold ? inlineActiveBtnStyle : {}), fontWeight: 700 }}
              >
                B
              </button>

              {/* Italic inline */}
              <button type="button"
                title={tf('italic')}
                onMouseDown={(e) => { e.preventDefault(); applyInline('italic'); }}
                style={{ ...btnBase, ...(inlineActive.italic ? inlineActiveBtnStyle : {}), fontStyle: 'italic', fontFamily: 'Georgia, serif' }}
              >
                I
              </button>

              {/* Underline inline */}
              <button type="button"
                title={tf('underline')}
                onMouseDown={(e) => { e.preventDefault(); applyInline('underline'); }}
                style={{ ...btnBase, ...(inlineActive.underline ? inlineActiveBtnStyle : {}), textDecoration: 'underline' }}
              >
                U
              </button>

              {/* Strikethrough inline */}
              <button type="button"
                title={tf('strikethrough')}
                onMouseDown={(e) => { e.preventDefault(); applyInline('strikethrough'); }}
                style={{ ...btnBase, ...(inlineActive.strikethrough ? inlineActiveBtnStyle : {}), textDecoration: 'line-through' }}
              >
                S
              </button>

              {/* Superscript */}
              <button type="button"
                title={tf('superscript')}
                onMouseDown={(e) => { e.preventDefault(); applyInline('superscript'); }}
                style={{ ...btnBase, ...(inlineActive.superscript ? inlineActiveBtnStyle : {}), fontSize: '11px' }}
              >
                A<sup style={{ fontSize: '8px' }}>2</sup>
              </button>

              {/* Subscript */}
              <button type="button"
                title={tf('subscript')}
                onMouseDown={(e) => { e.preventDefault(); applyInline('subscript'); }}
                style={{ ...btnBase, ...(inlineActive.subscript ? inlineActiveBtnStyle : {}), fontSize: '11px' }}
              >
                A<sub style={{ fontSize: '8px' }}>2</sub>
              </button>

              {/* Remove inline format */}
              <button type="button"
                title={tf('removeFormat')}
                onMouseDown={(e) => { e.preventDefault(); applyInline('removeFormat'); }}
                style={{ ...btnBase, color: '#94a3b8' }}
              >
                <RemoveFormatting size={13} />
              </button>

              {divider}
            </>
          )}

          {/* â”€â”€ Font family picker â€” native <select> so the option list is never clipped by overflow:auto â”€â”€ */}
          <select
            value={style.fontFamily || 'inherit'}
            onMouseDown={() => { if (isEditing) saveSelection(); }}
            onChange={(e) => {
              const f = e.target.value;
              if (isEditing) {
                wrapSelectionWithStyle(
                  'fontFamily',
                  f === 'inherit' ? '' : f,
                  () => apply({ fontFamily: f })
                );
              } else {
                apply({ fontFamily: f });
              }
            }}
            style={{
              border: '1px solid #e2e8f0',
              borderRadius: '5px',
              padding: '3px 4px',
              fontSize: '12px',
              color: '#1e293b',
              background: '#fff',
              cursor: 'pointer',
              height: 28,
              maxWidth: 110,
              fontFamily: style.fontFamily || 'inherit',
            }}
            title="Font"
          >
            {FONT_FAMILIES.map((f) => (
              <option key={f} value={f} style={{ fontFamily: f === 'inherit' ? 'inherit' : f }}>
                {f === 'inherit' ? 'Default' : f}
              </option>
            ))}
          </select>


          {/* â”€â”€ Font size â”€â”€ */}
          <select
            value={style.fontSize || 16}
            onMouseDown={() => { if (isEditing) saveSelection(); }}
            onChange={(e) => {
              const px = Number(e.target.value);
              if (isEditing) {
                wrapSelectionWithStyle('fontSize', `${px}px`, () => apply({ fontSize: px }));
              } else {
                apply({ fontSize: px });
              }
            }}
            style={{
              border: '1px solid #e2e8f0',
              borderRadius: '5px',
              padding: '3px 4px',
              fontSize: '12px',
              color: '#1e293b',
              background: '#fff',
              cursor: 'pointer',
              width: 54,
              height: 28,
            }}
            title="Cỡ chữ"
          >
            {FONT_SIZES.map((s) => (
              <option key={s} value={s}>{s}px</option>
            ))}
          </select>

          {divider}

          {/* ——— Block-level Bold / Italic / Underline (whole element) ——— */}
          {!isEditing && (
            <>
              <button
                type="button"
                style={{ ...btnBase, ...(style.fontWeight === 'bold' ? activeBtnStyle : {}) }}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); apply({ fontWeight: style.fontWeight === 'bold' ? 'normal' : 'bold' }); }}
                title="Bold toàn block"
              >
                <Bold size={13} />
              </button>
              <button
                type="button"
                style={{ ...btnBase, ...(style.fontStyle === 'italic' ? activeBtnStyle : {}) }}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); apply({ fontStyle: style.fontStyle === 'italic' ? 'normal' : 'italic' }); }}
                title="Italic toàn block"
              >
                <Italic size={13} />
              </button>
              <button
                type="button"
                style={{ ...btnBase, ...(style.textDecoration === 'underline' ? activeBtnStyle : {}) }}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); apply({ textDecoration: style.textDecoration === 'underline' ? 'none' : 'underline' }); }}
                title="Underline toàn block"
              >
                <Underline size={13} />
              </button>
              {divider}
            </>
          )}

          {/* ——— Text align — only in block-select mode ——— */}
          {!isEditing && (
            <>
              {(['left', 'center', 'right', 'justify'] as const).map((align, i) => {
                const icons = [AlignLeft, AlignCenter, AlignRight, AlignJustify];
                const Icon = icons[i];
                return (
                  <button
                    key={align}
                    type="button"
                    style={{ ...btnBase, ...(style.textAlign === align ? activeBtnStyle : {}) }}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); apply({ textAlign: align }); }}
                    title={`Align ${align}`}
                  >
                    <Icon size={13} />
                  </button>
                );
              })}
              {divider}
            </>
          )}

          {/* ── Text color ── */}
          <label
            style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', position: 'relative' }}
            title={isEditing ? 'Màu chữ (vùng bôi đen)' : 'Màu chữ'}
          >
            <div style={{
              width: 20,
              height: 20,
              borderRadius: '3px',
              background: textColorDebounce.local,
              border: '2px solid #e2e8f0',
              position: 'relative',
            }}>
              {isEditing && (
                <span style={{
                  position: 'absolute', bottom: -1, right: -1,
                  fontSize: 8, lineHeight: 1, color: '#4f46e5', fontWeight: 700,
                }}>A</span>
              )}
            </div>
            <input
              type="color"
              value={textColorDebounce.local}
              onChange={(e) => textColorDebounce.handleChange(e.target.value)}
              onBlur={textColorDebounce.handleBlur}
              style={{ opacity: 0, position: 'absolute', width: 0, height: 0 }}
            />
          </label>

          {/* ── Background / highlight color ── */}
          <label
            style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', position: 'relative' }}
            title={isEditing ? 'Highlight màu nền (vùng bôi đen)' : 'Màu nền block'}
          >
            <div style={{
              width: 20,
              height: 20,
              borderRadius: '3px',
              background: bgColorDebounce.local,
              border: '2px solid #e2e8f0',
              backgroundImage: !style.backgroundColor && !isEditing
                ? 'repeating-linear-gradient(45deg, #ddd 0,#ddd 2px,transparent 0,transparent 50%)'
                : 'none',
              backgroundSize: '6px 6px',
            }} />
            <input
              type="color"
              value={bgColorDebounce.local}
              onChange={(e) => bgColorDebounce.handleChange(e.target.value)}
              onBlur={bgColorDebounce.handleBlur}
              style={{ opacity: 0, position: 'absolute', width: 0, height: 0 }}
            />
          </label>
        </>
      )}

      {/* â”€â”€ Opacity â”€â”€ */}
      {divider}
      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#64748b' }}>
        <span>Opacity</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={style.opacity ?? 1}
          onMouseDown={() => { if (isEditing) saveSelection(); }}
          onChange={(e) => {
            const val = Number(e.target.value);
            if (isEditing) {
              wrapSelectionWithStyle('opacity', String(val), () => apply({ opacity: val }));
            } else {
              apply({ opacity: val });
            }
          }}
          style={{ width: 60, cursor: 'pointer' }}
        />
        <span style={{ minWidth: 28, textAlign: 'right', color: '#1e293b', fontWeight: 500 }}>
          {Math.round((style.opacity ?? 1) * 100)}%
        </span>
      </label>
    </div>
  );
}
