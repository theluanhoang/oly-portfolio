import type { SerializedCanvas, CanvasState } from '../types';
import { VISUAL_EDITOR_PREFIX } from '../types';

export function serializeCanvas(state: CanvasState): string {
  const serialized: SerializedCanvas = {
    version: '1',
    elements: state.elements,
    canvasWidth: state.canvasWidth,
    canvasHeight: state.canvasHeight,
    background: state.background,
  };
  return VISUAL_EDITOR_PREFIX + JSON.stringify(serialized);
}

export function isVisualEditorContent(value: string): boolean {
  return typeof value === 'string' && value.startsWith(VISUAL_EDITOR_PREFIX);
}
