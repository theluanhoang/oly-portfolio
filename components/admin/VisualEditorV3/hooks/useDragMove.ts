import { useRef, useCallback, useEffect } from 'react';

export interface UseDragMoveOptions {
  onDragStart?: (ids: string[]) => void;
  onDragMove?: (ids: string[], dx: number, dy: number) => void;
  onDragEnd?: (ids: string[], dx: number, dy: number) => void;
  canvasScale?: number; // for future zoom support
}

/** Minimum pixels the mouse must move before a drag is considered intentional. */
const DRAG_THRESHOLD = 4;

export function useDragMove(options: UseDragMoveOptions = {}) {
  const { onDragStart, onDragMove, onDragEnd, canvasScale = 1 } = options;

  // true once the threshold is crossed and onDragStart has been called
  const draggingRef = useRef(false);
  // true from mousedown until mouseup (even before threshold)
  const pendingRef = useRef(false);
  const idsRef = useRef<string[]>([]);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const lastDxRef = useRef(0);
  const lastDyRef = useRef(0);

  const startDrag = useCallback(
    (e: React.MouseEvent, ids: string[]) => {
      e.preventDefault();
      e.stopPropagation();
      // Mark as pending — do NOT call onDragStart yet (wait for threshold)
      pendingRef.current = true;
      draggingRef.current = false;
      idsRef.current = ids;
      startXRef.current = e.clientX;
      startYRef.current = e.clientY;
      lastDxRef.current = 0;
      lastDyRef.current = 0;
    },
    []
  );

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!pendingRef.current) return;

      const rawDx = e.clientX - startXRef.current;
      const rawDy = e.clientY - startYRef.current;

      // Activate drag only after threshold is crossed
      if (!draggingRef.current) {
        if (Math.abs(rawDx) < DRAG_THRESHOLD && Math.abs(rawDy) < DRAG_THRESHOLD) return;
        // Threshold crossed — start real drag
        draggingRef.current = true;
        onDragStart?.(idsRef.current);
      }

      const dx = rawDx / canvasScale;
      const dy = rawDy / canvasScale;
      const deltaDx = dx - lastDxRef.current;
      const deltaDy = dy - lastDyRef.current;
      lastDxRef.current = dx;
      lastDyRef.current = dy;
      onDragMove?.(idsRef.current, deltaDx, deltaDy);
    };

    const onMouseUp = () => {
      if (!pendingRef.current) return;
      pendingRef.current = false;
      if (draggingRef.current) {
        // Real drag ended
        draggingRef.current = false;
        onDragEnd?.(idsRef.current, lastDxRef.current, lastDyRef.current);
      }
      // If threshold was never crossed: it was just a click — do nothing
      idsRef.current = [];
      lastDxRef.current = 0;
      lastDyRef.current = 0;
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [canvasScale, onDragMove, onDragEnd, onDragStart]);

  return { startDrag };
}
