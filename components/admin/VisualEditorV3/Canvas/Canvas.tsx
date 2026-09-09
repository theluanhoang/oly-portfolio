'use client';

import { useRef, useCallback, useState, useEffect, useMemo } from 'react';
import type { CanvasElement, CanvasState, ResizeHandle } from '../types';
import { CanvasElementWrapper } from './CanvasElement';
import { SelectionBox } from './SelectionBox';
import { SmartGuides } from './SmartGuides';
import { useDragMove } from '../hooks/useDragMove';
import { useResize } from '../hooks/useResize';
import { computeSmartGuides, type GuideLine } from '../hooks/useSmartGuides';

interface CanvasProps {
  state: CanvasState;
  editingId: string | null;
  onSelectElement: (id: string, add: boolean) => void;
  onSelectMultiple: (ids: string[]) => void;
  onClearSelection: () => void;
  onMoveElements: (ids: string[], dx: number, dy: number) => void;
  onCommitMove: (ids: string[], dx: number, dy: number) => void;
  onResizeElement: (id: string, x: number, y: number, w: number, h: number) => void;
  onContentChange: (id: string, content: string) => void;
  onStartEdit: (id: string) => void;
  onStopEdit: () => void;
  /** Called whenever the canvas board's actual pixel width changes */
  onCanvasWidthChange?: (width: number) => void;
  /** External ref to receive the scroll container — used by parent to read scrollTop */
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
}

// Keep live resize state (not committed yet)
interface LiveResize {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export function Canvas({
  state,
  editingId,
  onSelectElement,
  onSelectMultiple,
  onClearSelection,
  onMoveElements,
  onCommitMove,
  onResizeElement,
  onContentChange,
  onStartEdit,
  onStopEdit,
  onCanvasWidthChange,
  scrollContainerRef: externalScrollContainerRef,
}: CanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  // Internal scroll container ref; also assigned to externalScrollContainerRef if provided
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // Callback ref that assigns both internal and external refs
  const setScrollContainer = useCallback((el: HTMLDivElement | null) => {
    (scrollContainerRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
    if (externalScrollContainerRef) {
      (externalScrollContainerRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
    }
  }, [externalScrollContainerRef]);
  const movingIdsRef = useRef<string[]>([]);
  const [liveResize, setLiveResize] = useState<LiveResize | null>(null);
  const liveResizeRef = useRef<LiveResize | null>(null);
  // Measure canvas board width from DOM for clamp calculations
  const [boardWidth, setBoardWidth] = useState(0);
  // During active drag: floor prevents canvas from shrinking mid-drag (avoids scroll-jump)
  const [dragHeightFloor, setDragHeightFloor] = useState(0);
  const dragHeightFloorRef = useRef(0); // ref copy for use inside closures without stale state
  // Guard: prevent useDragMove firing simultaneously with useResize
  const isResizingRef = useRef(false);
  // Auto-scroll during drag
  const isDraggingRef = useRef(false);
  const mousePosRef = useRef({ y: 0 });
  const rafRef = useRef<number | null>(null);
  // Store dragging IDs so RAF closure can access them for position compensation
  const draggingIdsRef = useRef<string[]>([]);
  // Scroll compensation: track scrollTop to compensate when user wheel/touchpad scrolls during drag
  const lastScrollTopRef = useRef(0);
  const scrollListenerCleanupRef = useRef<(() => void) | null>(null);

  // Auto-scroll loop: runs every animation frame while dragging
  const startAutoScroll = useCallback((onMove: (ids: string[], dx: number, dy: number) => void) => {
    const EDGE_ZONE = 100; // px from edge to start scrolling
    const MAX_SPEED = 8;   // max px/frame (slower = more controllable)

    const tick = () => {
      if (!isDraggingRef.current) return;
      const container = scrollContainerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        const mouseY = mousePosRef.current.y;

        // Clamp container bounds to actual viewport — prevents trigger when container extends beyond screen
        const visibleTop    = Math.max(rect.top, 0);
        const visibleBottom = Math.min(rect.bottom, window.innerHeight);

        const distTop    = mouseY - visibleTop;
        const distBottom = visibleBottom - mouseY;

        let scrolled = 0;
        if (distBottom < EDGE_ZONE && distBottom > 0) {
          // Near bottom — scroll down
          scrolled = Math.round(MAX_SPEED * Math.pow(1 - distBottom / EDGE_ZONE, 1.5));
        } else if (distTop < EDGE_ZONE && distTop > 0) {
          // Near top — scroll up
          scrolled = -Math.round(MAX_SPEED * Math.pow(1 - distTop / EDGE_ZONE, 1.5));
        }

        if (scrolled !== 0) {
          // Pre-update lastScrollTopRef BEFORE changing scrollTop.
          // This prevents the 'scroll' event listener from double-counting this scroll
          // (it would see delta=0 since we already advanced lastScrollTopRef).
          lastScrollTopRef.current = container.scrollTop + scrolled;
          container.scrollTop += scrolled;

          // Compensate block position so it stays under the cursor
          if (draggingIdsRef.current.length > 0) {
            onMove(draggingIdsRef.current, 0, scrolled);
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const stopAutoScroll = useCallback(() => {
    isDraggingRef.current = false;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  // Track mouse position globally for auto-scroll
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => { mousePosRef.current = { y: e.clientY }; };
    window.addEventListener('mousemove', onMouseMove);
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, []);

  useEffect(() => {
    const board = canvasRef.current;
    if (!board) return;
    const observer = new ResizeObserver(() => {
      const w = board.clientWidth;
      setBoardWidth(w);
      if (w > 0) onCanvasWidthChange?.(w);
    });
    observer.observe(board);
    const initial = board.clientWidth;
    if (initial > 0) {
      setBoardWidth(initial);
      onCanvasWidthChange?.(initial);
    }
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Use measured board width for clamping; fall back to state.canvasWidth
  const effectiveCanvasWidth = boardWidth > 0 ? boardWidth : state.canvasWidth;

  // ── Smart Guides state ─────────────────────────────────────────────────
  const [guides, setGuides] = useState<GuideLine[]>([]);

  // Auto-expanded canvas height: at least canvasHeight, grows to fit lowest block exactly
  const maxElementBottom = state.elements.length > 0
    ? Math.max(...state.elements.map((el) => el.y + el.height))
    : 0;
  const autoHeight = Math.max(state.canvasHeight, maxElementBottom);

  // ---- Drag (move) ----
  const { startDrag } = useDragMove({
    onDragStart: (ids) => {
      setGuides([]);
      // Capture current canvas height as floor — won't shrink below this during drag
      dragHeightFloorRef.current = autoHeight;
      setDragHeightFloor(autoHeight);
      // Start auto-scroll, pass onMoveElements so RAF can compensate block positions
      draggingIdsRef.current = ids;
      isDraggingRef.current = true;
      startAutoScroll(onMoveElements);

      // Scroll compensation: when user wheel/touchpad scrolls during drag,
      // move the block by the same delta so it stays under the cursor
      const container = scrollContainerRef.current;
      if (container) {
        lastScrollTopRef.current = container.scrollTop;
        const onScroll = () => {
          if (!isDraggingRef.current) return;
          const newScrollTop = container.scrollTop;
          const delta = newScrollTop - lastScrollTopRef.current;
          lastScrollTopRef.current = newScrollTop;
          if (delta !== 0 && draggingIdsRef.current.length > 0) {
            onMoveElements(draggingIdsRef.current, 0, delta);
          }
        };
        container.addEventListener('scroll', onScroll, { passive: true });
        scrollListenerCleanupRef.current = () => container.removeEventListener('scroll', onScroll);
      }
    },
    onDragMove: (ids, dx, dy) => {
      // Skip drag-move if a resize is in progress (both hooks share window mousemove)
      if (isResizingRef.current) return;

      // Apply the raw movement first
      onMoveElements(ids, dx, dy);

      // Grow the floor if elements are dragged lower
      const dragBottom = ids.reduce((max, id) => {
        const el = state.elements.find((e) => e.id === id);
        if (!el) return max;
        return Math.max(max, el.y + dy + el.height);
      }, 0);
      if (dragBottom > dragHeightFloorRef.current) {
        dragHeightFloorRef.current = dragBottom;
        setDragHeightFloor(dragBottom);
      }

      // Compute guide lines based on approximate new positions
      const draggingRects = ids.flatMap((id) => {
        const el = state.elements.find((e) => e.id === id);
        if (!el) return [];
        return [{ x: el.x + dx, y: el.y + dy, width: el.width, height: el.height }];
      });

      const staticRects = state.elements
        .filter((el) => !ids.includes(el.id))
        .map((el) => ({ x: el.x, y: el.y, width: el.width, height: el.height }));

      const { guides: newGuides } = computeSmartGuides(
        draggingRects,
        staticRects,
        effectiveCanvasWidth,
        autoHeight,
      );
      setGuides(newGuides);
    },
    onDragEnd: (ids) => {
      setGuides([]);
      onCommitMove(ids, 0, 0);
      movingIdsRef.current = [];
      // Release the floor — canvas contracts back to fit committed positions
      dragHeightFloorRef.current = 0;
      setDragHeightFloor(0);
      // Stop auto-scroll and remove scroll compensation listener
      stopAutoScroll();
      scrollListenerCleanupRef.current?.();
      scrollListenerCleanupRef.current = null;
    },
  });

  const handleMoveStart = useCallback(
    (e: React.MouseEvent, ids: string[]) => {
      movingIdsRef.current = ids;
      startDrag(e, ids);
    },
    [startDrag]
  );

  // ---- Resize ----
  const { startResize } = useResize({
    onResizeStart: () => {
      isResizingRef.current = true;
    },
    onResizeMove: (id, x, y, w, h) => {
      const cw = effectiveCanvasWidth;
      const ch = autoHeight; // use auto-expanded height, not fixed canvasHeight
      const clampedX = Math.max(0, x);
      const clampedW = Math.max(40, Math.min(w, cw - clampedX));
      const clampedY = Math.max(0, y);
      const clampedH = Math.max(20, h); // no upper clamp on Y — canvas expands
      const live = { id, x: clampedX, y: clampedY, width: clampedW, height: clampedH };
      setLiveResize(live);
      liveResizeRef.current = live;

      // Compute smart guides for the live resize rect
      const draggingRects = [{ x: clampedX, y: clampedY, width: clampedW, height: clampedH }];
      const staticRects = state.elements
        .filter((el) => el.id !== id)
        .map((el) => ({ x: el.x, y: el.y, width: el.width, height: el.height }));
      const { guides: newGuides } = computeSmartGuides(
        draggingRects,
        staticRects,
        effectiveCanvasWidth,
        autoHeight,
      );
      setGuides(newGuides);
    },
    onResizeEnd: (id) => {
      isResizingRef.current = false;
      const live = liveResizeRef.current;
      if (live && live.id === id) {
        onResizeElement(live.id, live.x, live.y, live.width, live.height);
      }
      setLiveResize(null);
      liveResizeRef.current = null;
      setGuides([]); // clear guides when resize ends
    },
  });


  const handleResizeStart = useCallback(
    (
      e: React.MouseEvent,
      handle: ResizeHandle,
      elementId: string,
      rect: { x: number; y: number; width: number; height: number }
    ) => {
      startResize(e, handle, elementId, rect);
    },
    [startResize]
  );

  // ---- Canvas click (clear selection) ----
  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement) === canvasRef.current) {
        onClearSelection();
        if (editingId) onStopEdit();
      }
    },
    [onClearSelection, editingId, onStopEdit]
  );

  // minHeight: use the drag floor during active drag so canvas never shrinks mid-drag
  const minHeight = dragHeightFloor > 0
    ? Math.max(autoHeight, dragHeightFloor)
    : autoHeight;

  // Build a merged view (apply live resize overrides)
  const visibleElements = state.elements.map((el) => {
    if (liveResize && liveResize.id === el.id) {
      return {
        ...el,
        x: liveResize.x,
        y: liveResize.y,
        width: liveResize.width,
        height: liveResize.height,
      };
    }
    return el;
  });

  return (
    <div
      ref={setScrollContainer}
      style={{
        flex: 1,
        minWidth: 0,
        overflowY: 'auto',
        overflowX: 'auto',
        background: '#e8e8e6',   // gray workspace — like Word/Docs
        padding: '32px 40px',    // breathing room around the page
        boxSizing: 'border-box',
      }}
    >
      <div
        ref={canvasRef}
        onMouseDown={handleCanvasMouseDown}
        style={{
          position: 'relative',
          width: '100%',
          minHeight,
          background: state.background,
          userSelect: 'none',
          overflow: 'hidden',
          // Page look: shadow + subtle border
          boxShadow: '0 2px 8px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.08)',
          borderRadius: '2px',
        }}
      >
        {/* Grid overlay (subtle dots) */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'radial-gradient(circle, #d0d5dd 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            pointerEvents: 'none',
            opacity: 0.35,
            borderRadius: 'inherit',
          }}
        />

        {/* Page boundary indicators — left and right edges (Word-style) */}
        <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}>
          {/* Left boundary */}
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: 2,
            borderLeft: '1px solid #d1d5db',
          }} />
          {/* Right boundary */}
          <div style={{
            position: 'absolute', right: 0, top: 0, bottom: 0,
            width: 2,
            borderRight: '1px solid #d1d5db',
          }} />
        </div>


        {/* Elements */}
        {visibleElements
          .sort((a, b) => a.zIndex - b.zIndex)
          .map((el) => (
            <CanvasElementWrapper
              key={el.id}
              element={el}
              isSelected={state.selectedIds.includes(el.id)}
              isEditing={editingId === el.id}
              onSelect={onSelectElement}
              onMoveStart={handleMoveStart}
              onMoveElements={onMoveElements}
              onCommitMove={onCommitMove}
              onResizeStart={handleResizeStart}
              onContentChange={onContentChange}
              onStartEdit={onStartEdit}
              onStopEdit={onStopEdit}
              selectedIds={state.selectedIds}
            />
          ))}

        {/* Smart alignment guides — rendered on top of everything */}
        <SmartGuides guides={guides} />

        {/* Rubber-band selection */}
        <SelectionBox canvasRef={canvasRef} onSelect={onSelectMultiple} />
      </div>
    </div>
  );
}
