// ============================================================
// VisualEditorV3 — Core Types
// Free-form canvas editor (Readymag-style)
// ============================================================

export type ElementType = 'text' | 'heading' | 'image' | 'divider' | 'embed';

export type HeadingLevel = 1 | 2 | 3 | 4;

export type ResizeHandle =
  | 'nw' | 'n' | 'ne'
  | 'w'  |       'e'
  | 'sw' | 's' | 'se';

// -------------------------------------------------------
// Element Style
// -------------------------------------------------------
export interface ElementStyle {
  fontFamily?: string;
  fontSize?: number;          // px
  fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline' | 'line-through';
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  lineHeight?: number;        // unitless multiplier
  letterSpacing?: number;     // em
  color?: string;             // CSS color
  backgroundColor?: string;
  opacity?: number;           // 0-1
  borderRadius?: number;      // px
  borderWidth?: number;       // px
  borderColor?: string;
  borderStyle?: 'none' | 'solid' | 'dashed' | 'dotted';
  padding?: number;           // px (uniform)
  objectFit?: 'cover' | 'contain' | 'fill' | 'none';
  // For divider
  dividerColor?: string;
  dividerThickness?: number;
  dividerStyle?: 'solid' | 'dashed' | 'dotted';
}

// -------------------------------------------------------
// Canvas Element
// -------------------------------------------------------
export interface CanvasElement {
  id: string;
  type: ElementType;
  x: number;           // left in px (from canvas origin)
  y: number;           // top in px (from canvas origin)
  width: number;       // px
  height: number;      // px (for text: auto-calculated, stores last known)
  zIndex: number;
  content: string;     // text HTML / image URL / embed src
  style: ElementStyle;
  locked?: boolean;
  // For heading
  headingLevel?: HeadingLevel;
  // For image
  altText?: string;
  // For embed
  embedUrl?: string;
}

// -------------------------------------------------------
// Canvas State
// -------------------------------------------------------
export interface CanvasState {
  elements: CanvasElement[];
  selectedIds: string[];
  canvasWidth: number;
  canvasHeight: number;    // minimum, expands with content
  background: string;      // CSS color/gradient
}

// -------------------------------------------------------
// History
// -------------------------------------------------------
export interface HistoryState {
  past: CanvasState[];
  present: CanvasState;
  future: CanvasState[];
}

// -------------------------------------------------------
// Actions
// -------------------------------------------------------
export type CanvasAction =
  | { type: 'ADD_ELEMENT'; payload: CanvasElement }
  | { type: 'UPDATE_ELEMENT'; payload: Partial<CanvasElement> & { id: string } }
  | { type: 'UPDATE_ELEMENT_STYLE'; payload: { id: string; style: Partial<ElementStyle> } }
  | { type: 'DELETE_ELEMENTS'; payload: string[] }
  | { type: 'SELECT_ELEMENTS'; payload: string[] }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'MOVE_ELEMENTS'; payload: { ids: string[]; dx: number; dy: number } }
  | { type: 'RESIZE_ELEMENT'; payload: { id: string; x: number; y: number; width: number; height: number } }
  | { type: 'REORDER_ELEMENT'; payload: { id: string; direction: 'up' | 'down' | 'top' | 'bottom' } }
  | { type: 'DUPLICATE_ELEMENTS'; payload: string[] }
  | { type: 'LOCK_ELEMENT'; payload: { id: string; locked: boolean } }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'PUSH_HISTORY' }
  | { type: 'SET_CANVAS'; payload: Partial<Pick<CanvasState, 'canvasWidth' | 'canvasHeight' | 'background'>> }
  | { type: 'LOAD_STATE'; payload: CanvasState };

// -------------------------------------------------------
// Serialized format
// -------------------------------------------------------
export const VISUAL_EDITOR_PREFIX = '__VISUAL_v1__';

export interface SerializedCanvas {
  version: '1';
  elements: CanvasElement[];
  canvasWidth: number;
  canvasHeight: number;
  background: string;
}

// -------------------------------------------------------
// Drag state (internal)
// -------------------------------------------------------
export interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  elementStartPositions: Record<string, { x: number; y: number }>;
}

// -------------------------------------------------------
// Resize state (internal)
// -------------------------------------------------------
export interface ResizeState {
  isResizing: boolean;
  handle: ResizeHandle | null;
  elementId: string | null;
  startMouseX: number;
  startMouseY: number;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
}

// -------------------------------------------------------
// Editor props
// -------------------------------------------------------
export interface VisualEditorV3Props {
  value: string;           // serialized JSON or empty
  onChange: (value: string) => void;
  locale?: string;
  readOnly?: boolean;
}
