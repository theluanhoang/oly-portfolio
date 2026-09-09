import { useRef, useCallback, useEffect } from 'react';
import type { ResizeHandle } from '../types';

export interface UseResizeOptions {
  onResizeStart?: () => void;
  onResizeMove?: (id: string, x: number, y: number, width: number, height: number) => void;
  onResizeEnd?: (id: string, x: number, y: number, width: number, height: number) => void;
  canvasScale?: number;
  minWidth?: number;
  minHeight?: number;
}

export function useResize(options: UseResizeOptions = {}) {
  const {
    onResizeStart,
    onResizeMove,
    onResizeEnd,
    canvasScale = 1,
    minWidth = 40,
    minHeight = 20,
  } = options;

  const resizingRef = useRef(false);
  const handleRef = useRef<ResizeHandle | null>(null);
  const elementIdRef = useRef<string | null>(null);
  const startMouseRef = useRef({ x: 0, y: 0 });
  const startRectRef = useRef({ x: 0, y: 0, width: 0, height: 0 });

  const startResize = useCallback(
    (
      e: React.MouseEvent,
      handle: ResizeHandle,
      elementId: string,
      currentRect: { x: number; y: number; width: number; height: number }
    ) => {
      e.preventDefault();
      e.stopPropagation();
      resizingRef.current = true;
      handleRef.current = handle;
      elementIdRef.current = elementId;
      startMouseRef.current = { x: e.clientX, y: e.clientY };
      startRectRef.current = { ...currentRect };
      onResizeStart?.();
    },
    [onResizeStart]
  );

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!resizingRef.current || !handleRef.current || !elementIdRef.current) return;

      const dx = (e.clientX - startMouseRef.current.x) / canvasScale;
      const dy = (e.clientY - startMouseRef.current.y) / canvasScale;
      const { x, y, width, height } = startRectRef.current;
      const handle = handleRef.current;

      let newX = x;
      let newY = y;
      let newW = width;
      let newH = height;

      // North (top)
      if (handle === 'n' || handle === 'nw' || handle === 'ne') {
        newH = Math.max(minHeight, height - dy);
        newY = y + (height - newH);
      }
      // South (bottom)
      if (handle === 's' || handle === 'sw' || handle === 'se') {
        newH = Math.max(minHeight, height + dy);
      }
      // West (left)
      if (handle === 'w' || handle === 'nw' || handle === 'sw') {
        newW = Math.max(minWidth, width - dx);
        newX = x + (width - newW);
      }
      // East (right)
      if (handle === 'e' || handle === 'ne' || handle === 'se') {
        newW = Math.max(minWidth, width + dx);
      }

      onResizeMove?.(elementIdRef.current, newX, newY, newW, newH);
    };

    const onMouseUp = () => {
      if (!resizingRef.current || !elementIdRef.current) return;
      const id = elementIdRef.current;
      resizingRef.current = false;
      handleRef.current = null;
      elementIdRef.current = null;
      // onResizeEnd committed elsewhere via latest state
      onResizeEnd?.(id, 0, 0, 0, 0); // signal done
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [canvasScale, minWidth, minHeight, onResizeMove, onResizeEnd]);

  return { startResize, isResizing: resizingRef };
}
