'use client';

import { useRef, useEffect, useState } from 'react';

interface SelectionBoxProps {
  canvasRef: React.RefObject<HTMLDivElement | null>;
  onSelect: (ids: string[]) => void;
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function SelectionBox({ canvasRef, onSelect }: SelectionBoxProps) {
  const [box, setBox] = useState<Rect | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const isSelectingRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onMouseDown = (e: MouseEvent) => {
      // Only rubber-band on direct canvas click (not element click)
      if ((e.target as HTMLElement) !== canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      startRef.current = { x, y };
      isSelectingRef.current = true;
      setBox({ x, y, width: 0, height: 0 });
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isSelectingRef.current || !startRef.current) return;
      const rect = canvas.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const x = Math.min(cx, startRef.current.x);
      const y = Math.min(cy, startRef.current.y);
      const width = Math.abs(cx - startRef.current.x);
      const height = Math.abs(cy - startRef.current.y);
      setBox({ x, y, width, height });
    };

    const onMouseUp = () => {
      if (!isSelectingRef.current || !startRef.current) return;
      isSelectingRef.current = false;

      // Find elements that overlap with the selection box
      if (box && (box.width > 5 || box.height > 5)) {
        const elements = canvas.querySelectorAll('[data-element-id]');
        const selected: string[] = [];
        elements.forEach((el) => {
          const elRect = (el as HTMLElement).getBoundingClientRect();
          const canvasRect = canvas.getBoundingClientRect();
          const elX = elRect.left - canvasRect.left;
          const elY = elRect.top - canvasRect.top;
          if (
            elX < (box.x + box.width) &&
            elX + elRect.width > box.x &&
            elY < (box.y + box.height) &&
            elY + elRect.height > box.y
          ) {
            const id = (el as HTMLElement).dataset.elementId;
            if (id) selected.push(id);
          }
        });
        if (selected.length > 0) onSelect(selected);
      }

      setBox(null);
      startRef.current = null;
    };

    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [canvasRef, box, onSelect]);

  if (!box || (box.width < 2 && box.height < 2)) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: box.x,
        top: box.y,
        width: box.width,
        height: box.height,
        border: '1.5px dashed #4f86f7',
        backgroundColor: 'rgba(79, 134, 247, 0.08)',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  );
}
