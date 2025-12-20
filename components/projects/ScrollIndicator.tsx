import { forwardRef } from 'react';

interface ScrollIndicatorProps {
  [key: string]: unknown;
}

const ScrollIndicator = forwardRef<HTMLDivElement, ScrollIndicatorProps>(function ScrollIndicator(props, ref) {
  return (
    <div
      ref={ref}
      className="fixed bottom-[30px] left-1/2 -translate-x-1/2 text-[#666] text-xs tracking-[2px] z-40 opacity-70"
    >
    </div>
  );
});

export default ScrollIndicator;

