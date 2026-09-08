import { useEffect } from 'react';

export interface UseKeyboardOptions {
  onDelete?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onDuplicate?: () => void;
  onEscape?: () => void;
  onSelectAll?: () => void;
  enabled?: boolean;
}

export function useKeyboard({
  onDelete,
  onUndo,
  onRedo,
  onDuplicate,
  onEscape,
  onSelectAll,
  enabled = true,
}: UseKeyboardOptions) {
  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      // Don't intercept when user is typing in an input, textarea, or contenteditable
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const isCtrl = e.ctrlKey || e.metaKey;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        onDelete?.();
      } else if (isCtrl && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        onUndo?.();
      } else if (isCtrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        onRedo?.();
      } else if (isCtrl && e.key === 'd') {
        e.preventDefault();
        onDuplicate?.();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onEscape?.();
      } else if (isCtrl && e.key === 'a') {
        e.preventDefault();
        onSelectAll?.();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [enabled, onDelete, onUndo, onRedo, onDuplicate, onEscape, onSelectAll]);
}
