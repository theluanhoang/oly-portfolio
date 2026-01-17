import type { ReactElement } from 'react';

export function DefaultLoading(): ReactElement {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
    </div>
  );
}
