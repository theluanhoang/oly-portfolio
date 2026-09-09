'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// -------------------------------------------------------
// Toolbar types
// -------------------------------------------------------
type FormatCmd =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strikethrough'
  | 'superscript'
  | 'subscript'
  | 'removeFormat'
  | 'createLink';

interface ToolbarItem {
  cmd: FormatCmd;
  label: string;
  title: string;
  checkCmd?: string; // queryCommandState key
}

const TOOLBAR_ITEMS: ToolbarItem[] = [
  { cmd: 'bold',          label: 'B',   title: 'In dam (Ctrl+B)',          checkCmd: 'bold' },
  { cmd: 'italic',        label: 'I',   title: 'In nghieng (Ctrl+I)',      checkCmd: 'italic' },
  { cmd: 'underline',     label: 'U',   title: 'Gach duoi (Ctrl+U)',       checkCmd: 'underline' },
  { cmd: 'strikethrough', label: 'S',   title: 'Gach ngang',               checkCmd: 'strikethrough' },
  { cmd: 'superscript',   label: 'sup', title: 'So mu (superscript)',      checkCmd: 'superscript' },
  { cmd: 'subscript',     label: 'sub', title: 'Chi so duoi (subscript)',  checkCmd: 'subscript' },
  { cmd: 'removeFormat',  label: 'x',   title: 'Xoa dinh dang' },
];

// -------------------------------------------------------
// Hook: track selection and return position + active state
// -------------------------------------------------------
interface SelectionState {
  visible: boolean;
  x: number;
  y: number;
  active: Record<string, boolean>;
}

function getActiveFormats(): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  try {
    result.bold        = document.queryCommandState('bold');
    result.italic      = document.queryCommandState('italic');
    result.underline   = document.queryCommandState('underline');
    result.strikethrough = document.queryCommandState('strikethrough');
    result.superscript = document.queryCommandState('superscript');
    result.subscript   = document.queryCommandState('subscript');
  } catch {
    // ignore
  }
  return result;
}

// -------------------------------------------------------
// Main component
// -------------------------------------------------------
interface InlineFormatToolbarProps {
  /** The contentEditable container element (passed as ref) */
  editableRef: React.RefObject<HTMLElement | null>;
  /** Whether the element is currently in edit mode */
  isEditing: boolean;
  /** Called when a format command is applied (so parent can sync innerHTML) */
  onFormatApplied: () => void;
}

export function InlineFormatToolbar({
  editableRef,
  isEditing,
  onFormatApplied,
}: InlineFormatToolbarProps) {
  const [state, setState] = useState<SelectionState>({
    visible: false,
    x: 0,
    y: 0,
    active: {},
  });
  const toolbarRef = useRef<HTMLDivElement>(null);

  const updateFromSelection = useCallback(() => {
    if (!isEditing) {
      setState((s) => ({ ...s, visible: false }));
      return;
    }

    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
      setState((s) => ({ ...s, visible: false }));
      return;
    }

    // Make sure selection is inside our editable element
    const range = sel.getRangeAt(0);
    const container = editableRef.current;
    if (!container || !container.contains(range.commonAncestorContainer)) {
      setState((s) => ({ ...s, visible: false }));
      return;
    }

    // Position toolbar above the selection
    const rect = range.getBoundingClientRect();
    if (rect.width === 0) {
      setState((s) => ({ ...s, visible: false }));
      return;
    }

    // Use viewport-relative coords; toolbar will use fixed positioning
    const x = rect.left + rect.width / 2;
    const y = rect.top - 8; // 8px gap above selection

    setState({
      visible: true,
      x,
      y,
      active: getActiveFormats(),
    });
  }, [isEditing, editableRef]);

  // Listen to selectionchange globally
  useEffect(() => {
    if (!isEditing) {
      setState((s) => ({ ...s, visible: false }));
      return;
    }
    document.addEventListener('selectionchange', updateFromSelection);
    return () => {
      document.removeEventListener('selectionchange', updateFromSelection);
    };
  }, [isEditing, updateFromSelection]);

  // Hide when clicking outside toolbar
  useEffect(() => {
    if (!state.visible) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (toolbarRef.current && toolbarRef.current.contains(e.target as Node)) return;
      // Clicking inside the editable is fine (may change selection)
      if (editableRef.current && editableRef.current.contains(e.target as Node)) return;
      setState((s) => ({ ...s, visible: false }));
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [state.visible, editableRef]);

  const applyFormat = useCallback(
    (cmd: FormatCmd) => {
      // Restore focus & selection (toolbar button click can deselect)
      editableRef.current?.focus();

      if (cmd === 'createLink') {
        const url = prompt('Nhập URL:');
        if (!url) return;
        document.execCommand('createLink', false, url);
      } else {
        document.execCommand(cmd, false);
      }

      // Refresh active state
      setState((s) => ({ ...s, active: getActiveFormats() }));
      onFormatApplied();
    },
    [editableRef, onFormatApplied]
  );

  if (!state.visible) return null;

  // Toolbar width estimate: ~32px per button
  const toolbarWidth = TOOLBAR_ITEMS.length * 34 + 8;

  return (
    <div
      ref={toolbarRef}
      role="toolbar"
      aria-label="Định dạng văn bản"
      onMouseDown={(e) => e.preventDefault()} // Prevent losing selection on click
      style={{
        position: 'fixed',
        left: Math.max(8, Math.min(state.x - toolbarWidth / 2, window.innerWidth - toolbarWidth - 8)),
        top: Math.max(8, state.y - 42), // 42px = toolbar height
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '8px',
        padding: '4px 6px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        animation: 'fadeInToolbar 0.1s ease',
      }}
    >
      {/* Style injection for animation */}
      <style>{`
        @keyframes fadeInToolbar {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {TOOLBAR_ITEMS.map((item, idx) => {
        const isActive = item.checkCmd ? state.active[item.checkCmd] : false;
        const isRemove = item.cmd === 'removeFormat';
        // Separator before superscript group and before removeFormat
        const isSeparator = item.cmd === 'superscript' || item.cmd === 'removeFormat';

        return (
          <span key={item.cmd} style={{ display: 'contents' }}>
            {isSeparator && (
              <div style={{ width: 1, height: 18, background: '#334155', margin: '0 3px' }} />
            )}
            <button
              type="button"
              title={item.title}
              onMouseDown={(e) => {
                e.preventDefault();
                applyFormat(item.cmd);
              }}
              style={{
                width: 30,
                height: 28,
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: item.cmd === 'italic' ? 'normal' : 700,
                fontStyle: item.cmd === 'italic' ? 'italic' : 'normal',
                textDecoration: item.cmd === 'underline' ? 'underline' : item.cmd === 'strikethrough' ? 'line-through' : 'none',
                fontSize: isRemove ? '12px' : '13px',
                fontFamily: 'Georgia, serif',
                transition: 'all 0.1s',
                background: isActive
                  ? 'rgba(99,102,241,0.9)'
                  : isRemove
                  ? 'rgba(239,68,68,0.15)'
                  : 'transparent',
                color: isActive ? '#fff' : isRemove ? '#f87171' : '#e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {item.cmd === 'superscript' ? (
                <span style={{ fontSize: '12px', fontFamily: 'Georgia, serif', lineHeight: 1 }}>
                  A<sup style={{ fontSize: '8px' }}>2</sup>
                </span>
              ) : item.cmd === 'subscript' ? (
                <span style={{ fontSize: '12px', fontFamily: 'Georgia, serif', lineHeight: 1 }}>
                  A<sub style={{ fontSize: '8px' }}>2</sub>
                </span>
              ) : (
                item.label
              )}
            </button>
          </span>
        );
      })}
    </div>
  );
}
