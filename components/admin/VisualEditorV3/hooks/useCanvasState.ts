import { useReducer, useCallback, useMemo } from 'react';
import type {
  CanvasState,
  CanvasElement,
  CanvasAction,
  ElementStyle,
} from '../types';
import { useHistory } from './useHistory';

// -------------------------------------------------------
// Initial State
// -------------------------------------------------------
export const createInitialState = (): CanvasState => ({
  elements: [],
  selectedIds: [],
  canvasWidth: 1200,
  canvasHeight: 1200,
  background: '#ffffff',
});

// -------------------------------------------------------
// Reducer
// -------------------------------------------------------
function canvasReducer(state: CanvasState, action: CanvasAction): CanvasState {
  switch (action.type) {
    case 'LOAD_STATE':
      return { ...action.payload, selectedIds: [] };

    case 'ADD_ELEMENT':
      return {
        ...state,
        elements: [...state.elements, action.payload],
        selectedIds: [action.payload.id],
      };

    case 'UPDATE_ELEMENT': {
      const { id, ...updates } = action.payload;
      return {
        ...state,
        elements: state.elements.map((el) =>
          el.id === id ? { ...el, ...updates } : el
        ),
      };
    }

    case 'UPDATE_ELEMENT_STYLE': {
      const { id, style } = action.payload;
      return {
        ...state,
        elements: state.elements.map((el) =>
          el.id === id
            ? { ...el, style: { ...el.style, ...style } }
            : el
        ),
      };
    }

    case 'DELETE_ELEMENTS':
      return {
        ...state,
        elements: state.elements.filter((el) => !action.payload.includes(el.id)),
        selectedIds: state.selectedIds.filter((id) => !action.payload.includes(id)),
      };

    case 'SELECT_ELEMENTS':
      return { ...state, selectedIds: action.payload };

    case 'CLEAR_SELECTION':
      return { ...state, selectedIds: [] };

    case 'MOVE_ELEMENTS': {
      const { ids, dx, dy } = action.payload;
      const cw = state.canvasWidth;
      return {
        ...state,
        elements: state.elements.map((el) => {
          if (!ids.includes(el.id) || el.locked) return el;
          // Clamp X: stay within canvas width
          const newX = Math.min(Math.max(0, el.x + dx), cw - el.width);
          // Y: no upper clamp — canvas auto-expands vertically
          const newY = Math.max(0, el.y + dy);
          return { ...el, x: newX, y: newY };
        }),
      };
    }

    case 'RESIZE_ELEMENT': {
      const { id, x, y, width, height } = action.payload;
      const cw = state.canvasWidth;
      const clampedX = Math.max(0, x);
      const clampedW = Math.max(40, Math.min(width, cw - clampedX));
      const clampedY = Math.max(0, y);
      const clampedH = Math.max(20, height); // no upper Y clamp — canvas auto-expands
      return {
        ...state,
        elements: state.elements.map((el) =>
          el.id === id
            ? { ...el, x: clampedX, y: clampedY, width: clampedW, height: clampedH }
            : el
        ),
      };
    }


    case 'REORDER_ELEMENT': {
      const { id, direction } = action.payload;
      const elements = [...state.elements];
      const idx = elements.findIndex((el) => el.id === id);
      if (idx === -1) return state;
      const maxZ = Math.max(...elements.map((el) => el.zIndex));
      const minZ = Math.min(...elements.map((el) => el.zIndex));
      const el = elements[idx];

      let newZ = el.zIndex;
      if (direction === 'up') newZ = el.zIndex + 1;
      else if (direction === 'down') newZ = Math.max(0, el.zIndex - 1);
      else if (direction === 'top') newZ = maxZ + 1;
      else if (direction === 'bottom') newZ = Math.max(0, minZ - 1);

      return {
        ...state,
        elements: elements.map((e) =>
          e.id === id ? { ...e, zIndex: newZ } : e
        ),
      };
    }

    case 'DUPLICATE_ELEMENTS': {
      const ids = action.payload;
      const now = Date.now();
      const newElements: CanvasElement[] = [];
      const newIds: string[] = [];
      state.elements.forEach((el) => {
        if (ids.includes(el.id)) {
          const newId = `el-${now}-${Math.random().toString(36).slice(2, 8)}`;
          newElements.push({ ...el, id: newId, x: el.x + 20, y: el.y + 20 });
          newIds.push(newId);
        }
      });
      return {
        ...state,
        elements: [...state.elements, ...newElements],
        selectedIds: newIds,
      };
    }

    case 'LOCK_ELEMENT': {
      const { id, locked } = action.payload;
      return {
        ...state,
        elements: state.elements.map((el) =>
          el.id === id ? { ...el, locked } : el
        ),
      };
    }

    case 'SET_CANVAS': {
      const next = { ...state, ...action.payload };
      // If canvasWidth changed, re-clamp all element X positions to new boundary
      // (Y axis is not clamped since canvas height auto-expands)
      if (action.payload.canvasWidth && action.payload.canvasWidth !== state.canvasWidth) {
        const cw = action.payload.canvasWidth;
        next.elements = next.elements.map((el) => {
          const x = Math.max(0, Math.min(el.x, cw - Math.min(el.width, cw)));
          const w = Math.min(el.width, cw);
          return { ...el, x, width: w };
        });
      }
      return next;
    }

    default:
      return state;
  }
}

// -------------------------------------------------------
// Hook
// -------------------------------------------------------
export function useCanvasState(initialContent?: CanvasState) {
  const initial = initialContent ?? createInitialState();
  const [state, dispatch] = useReducer(canvasReducer, initial);
  const history = useHistory(initial);

  // Wrap dispatch to inject history push before destructive actions
  const dispatchWithHistory = useCallback(
    (action: CanvasAction) => {
      const needsHistory = [
        'ADD_ELEMENT', 'DELETE_ELEMENTS', 'MOVE_ELEMENTS',
        'RESIZE_ELEMENT', 'UPDATE_ELEMENT', 'UPDATE_ELEMENT_STYLE',
        'REORDER_ELEMENT', 'DUPLICATE_ELEMENTS', 'LOCK_ELEMENT',
      ].includes(action.type);

      if (needsHistory) {
        history.pushHistory(state);
      }

      dispatch(action);
    },
    [state, history]
  );

  const undo = useCallback(() => {
    const prev = history.undo();
    if (prev) dispatch({ type: 'LOAD_STATE', payload: prev });
  }, [history]);

  const redo = useCallback(() => {
    const next = history.redo();
    if (next) dispatch({ type: 'LOAD_STATE', payload: next });
  }, [history]);

  // Helpers
  const addElement = useCallback((el: Omit<CanvasElement, 'id' | 'zIndex'>) => {
    const maxZ = state.elements.length > 0
      ? Math.max(...state.elements.map((e) => e.zIndex))
      : 0;
    const id = `el-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    dispatchWithHistory({
      type: 'ADD_ELEMENT',
      payload: { ...el, id, zIndex: maxZ + 1 } as CanvasElement,
    });
    return id;
  }, [state.elements, dispatchWithHistory]);

  const updateElement = useCallback(
    (id: string, updates: Partial<Omit<CanvasElement, 'id'>>) => {
      dispatchWithHistory({ type: 'UPDATE_ELEMENT', payload: { id, ...updates } });
    },
    [dispatchWithHistory]
  );

  const updateElementStyle = useCallback(
    (id: string, style: Partial<ElementStyle>) => {
      dispatchWithHistory({ type: 'UPDATE_ELEMENT_STYLE', payload: { id, style } });
    },
    [dispatchWithHistory]
  );

  const deleteSelected = useCallback(() => {
    if (state.selectedIds.length > 0) {
      dispatchWithHistory({ type: 'DELETE_ELEMENTS', payload: state.selectedIds });
    }
  }, [state.selectedIds, dispatchWithHistory]);

  const selectElement = useCallback(
    (id: string, addToSelection = false) => {
      if (addToSelection) {
        const newSelected = state.selectedIds.includes(id)
          ? state.selectedIds.filter((sid) => sid !== id)
          : [...state.selectedIds, id];
        dispatch({ type: 'SELECT_ELEMENTS', payload: newSelected });
      } else {
        dispatch({ type: 'SELECT_ELEMENTS', payload: [id] });
      }
    },
    [state.selectedIds]
  );

  const clearSelection = useCallback(() => {
    dispatch({ type: 'CLEAR_SELECTION' });
  }, []);

  const moveElements = useCallback(
    (ids: string[], dx: number, dy: number) => {
      dispatch({ type: 'MOVE_ELEMENTS', payload: { ids, dx, dy } });
    },
    []
  );

  const commitMove = useCallback(
    (ids: string[], dx: number, dy: number) => {
      dispatchWithHistory({ type: 'MOVE_ELEMENTS', payload: { ids, dx, dy } });
    },
    [dispatchWithHistory]
  );

  const resizeElement = useCallback(
    (id: string, x: number, y: number, w: number, h: number) => {
      dispatchWithHistory({
        type: 'RESIZE_ELEMENT',
        payload: { id, x, y, width: w, height: h },
      });
    },
    [dispatchWithHistory]
  );

  const duplicateSelected = useCallback(() => {
    if (state.selectedIds.length > 0) {
      dispatchWithHistory({ type: 'DUPLICATE_ELEMENTS', payload: state.selectedIds });
    }
  }, [state.selectedIds, dispatchWithHistory]);

  const selectedElements = useMemo(
    () => state.elements.filter((el) => state.selectedIds.includes(el.id)),
    [state.elements, state.selectedIds]
  );

  const loadState = useCallback((newState: CanvasState) => {
    dispatch({ type: 'LOAD_STATE', payload: newState });
    history.clearHistory(newState);
  }, [history]);

  return {
    state,
    dispatch: dispatchWithHistory,
    addElement,
    updateElement,
    updateElementStyle,
    deleteSelected,
    selectElement,
    clearSelection,
    moveElements,
    commitMove,
    resizeElement,
    duplicateSelected,
    selectedElements,
    loadState,
    undo,
    redo,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
  };
}

export type CanvasStateContext = ReturnType<typeof useCanvasState>;
