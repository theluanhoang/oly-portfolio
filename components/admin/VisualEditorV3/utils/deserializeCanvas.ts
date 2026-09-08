import type { SerializedCanvas, CanvasState } from '../types';
import { VISUAL_EDITOR_PREFIX } from '../types';
import { createInitialState } from '../hooks/useCanvasState';

export function deserializeCanvas(value: string): CanvasState | null {
  if (!value || !value.startsWith(VISUAL_EDITOR_PREFIX)) return null;

  try {
    const json = value.slice(VISUAL_EDITOR_PREFIX.length);
    const parsed: SerializedCanvas = JSON.parse(json);

    if (parsed.version !== '1') return null;

    return {
      elements: parsed.elements || [],
      selectedIds: [],
      canvasWidth: parsed.canvasWidth || 1200,
      canvasHeight: parsed.canvasHeight || 800,
      background: parsed.background || '#ffffff',
    };
  } catch {
    return null;
  }
}

export function deserializeOrEmpty(value: string): CanvasState {
  return deserializeCanvas(value) ?? createInitialState();
}
