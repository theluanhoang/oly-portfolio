"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface StickyBoxProps {
  children: React.ReactNode;
  topOffset?: number;
  /** Minimum window width (px) to activate sticky. Default 1024 (Tailwind lg:) */
  minWidth?: number;
}

/**
 * StickyBox: keeps children pinned in viewport using position:fixed.
 * Only activates on screens >= minWidth (default 1024px = Tailwind lg:).
 * On smaller screens renders children normally without any sticky behavior.
 */
export default function StickyBox({ children, topOffset = 70, minWidth = 1024 }: StickyBoxProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"normal" | "fixed" | "bottom">("normal");
  const [fixedLeft, setFixedLeft] = useState(0);
  const [fixedWidth, setFixedWidth] = useState(0);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  const updatePosition = useCallback(() => {
    const isLarge = window.innerWidth >= minWidth;
    setIsLargeScreen(isLarge);

    // On small screens, reset to normal and skip sticky logic
    if (!isLarge) {
      setState("normal");
      return;
    }

    if (!parentRef.current || !contentRef.current) return;

    const parentRect = parentRef.current.getBoundingClientRect();
    const contentHeight = contentRef.current.offsetHeight;

    const shouldFix = parentRect.top <= topOffset;
    const atBottom = parentRect.bottom <= contentHeight + topOffset;

    if (atBottom) {
      setState("bottom");
    } else if (shouldFix) {
      setState("fixed");
      setFixedLeft(parentRect.left);
      setFixedWidth(parentRect.width);
    } else {
      setState("normal");
    }
  }, [topOffset, minWidth]);

  useEffect(() => {
    window.addEventListener("scroll", updatePosition, { passive: true });
    window.addEventListener("resize", updatePosition, { passive: true });
    updatePosition();

    return () => {
      window.removeEventListener("scroll", updatePosition);
      window.removeEventListener("resize", updatePosition);
    };
  }, [updatePosition]);

  const contentHeight = contentRef.current?.offsetHeight ?? 0;

  return (
    <div ref={parentRef} className="relative h-full">
      {/* Spacer: only needed when fixed on large screens */}
      {isLargeScreen && state === "fixed" && (
        <div style={{ height: contentHeight }} aria-hidden="true" />
      )}

      <div
        ref={contentRef}
        style={
          isLargeScreen && state === "fixed"
            ? {
                position: "fixed",
                top: `${topOffset}px`,
                left: `${fixedLeft}px`,
                width: `${fixedWidth}px`,
                zIndex: 10,
              }
            : isLargeScreen && state === "bottom"
            ? {
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
              }
            : undefined // mobile/tablet: completely normal flow
        }
      >
        {children}
      </div>
    </div>
  );
}

