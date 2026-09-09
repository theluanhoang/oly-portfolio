import { useCallback, useRef } from 'react';
import type { CanvasState } from '../types';

const MAX_HISTORY = 50;

export interface UseHistoryReturn {
  pushHistory: (state: CanvasState) => void;
  undo: () => CanvasState | null;
  redo: () => CanvasState | null;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: (initialState: CanvasState) => void;
}

export function useHistory(initialState: CanvasState): UseHistoryReturn {
  const pastRef = useRef<CanvasState[]>([]);
  const futureRef = useRef<CanvasState[]>([]);

  const pushHistory = useCallback((state: CanvasState) => {
    pastRef.current = [...pastRef.current.slice(-MAX_HISTORY + 1), state];
    futureRef.current = [];
  }, []);

  const undo = useCallback((): CanvasState | null => {
    const past = pastRef.current;
    if (past.length === 0) return null;
    const previous = past[past.length - 1];
    pastRef.current = past.slice(0, past.length - 1);
    return previous;
  }, []);

  const redo = useCallback((): CanvasState | null => {
    const future = futureRef.current;
    if (future.length === 0) return null;
    const next = future[0];
    futureRef.current = future.slice(1);
    return next;
  }, []);

  const canUndo = useCallback(() => pastRef.current.length > 0, []);
  const canRedo = useCallback(() => futureRef.current.length > 0, []);

  const clearHistory = useCallback((state: CanvasState) => {
    pastRef.current = [state];
    futureRef.current = [];
  }, []);

  return { pushHistory, undo, redo, canUndo, canRedo, clearHistory };
}
