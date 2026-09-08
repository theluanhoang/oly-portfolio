'use client';

import type { CanvasElement } from '../types';

interface DividerElementProps {
  element: CanvasElement;
}

export function DividerElement({ element }: DividerElementProps) {
  const color = element.style.dividerColor || element.style.color || '#d1d5db';
  const thickness = element.style.dividerThickness || element.style.borderWidth || 1;
  const style = element.style.dividerStyle || element.style.borderStyle || 'solid';
  const opacity = element.style.opacity ?? 1;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        padding: '0 8px',
        opacity,
      }}
    >
      <hr
        style={{
          width: '100%',
          border: 'none',
          borderTop: `${thickness}px ${style} ${color}`,
          margin: 0,
        }}
      />
    </div>
  );
}
