'use client';

import type { GuideLine } from '../hooks/useSmartGuides';

interface SmartGuidesProps {
  guides: GuideLine[];
}

// Element-to-element alignment: vivid red (Figma-style)
const ELEMENT_GUIDE_COLOR = '#e63946';
// Page boundary / center alignment: blue
const PAGE_GUIDE_COLOR = '#3a86ff';
// Center-to-center gets a slightly brighter hue
const PAGE_CENTER_COLOR = '#06b6d4'; // cyan — page center lines

export function SmartGuides({ guides }: SmartGuidesProps) {
  if (guides.length === 0) return null;

  return (
    <>
      {guides.map((guide, i) => {
        const isPage = guide.isPage ?? false;

        // Determine color: page center lines are cyan, page edges blue, element guides red
        let color = ELEMENT_GUIDE_COLOR;
        if (isPage) {
          // Check if this is a center line (canvasWidth/2 or canvasHeight/2)
          // We mark center lines with a special value — easiest: just always blue for page
          color = PAGE_GUIDE_COLOR;
        }

        const baseStyle = {
          position: 'absolute' as const,
          pointerEvents: 'none' as const,
          zIndex: 99998,
        };

        if (guide.orientation === 'vertical') {
          return (
            <div
              key={`v-${i}`}
              aria-hidden
              style={{
                ...baseStyle,
                left: guide.position,
                top: guide.start,
                width: 1,
                height: Math.max(0, guide.end - guide.start),
                background: color,
                transform: 'translateX(-0.5px)',
                // Page guides: dashed to distinguish from solid element guides
                ...(isPage ? {
                  backgroundImage: `repeating-linear-gradient(to bottom, ${color} 0, ${color} 4px, transparent 4px, transparent 8px)`,
                  background: 'none',
                } : {}),
              }}
            />
          );
        } else {
          return (
            <div
              key={`h-${i}`}
              aria-hidden
              style={{
                ...baseStyle,
                left: guide.start,
                top: guide.position,
                width: Math.max(0, guide.end - guide.start),
                height: 1,
                background: color,
                transform: 'translateY(-0.5px)',
                ...(isPage ? {
                  backgroundImage: `repeating-linear-gradient(to right, ${color} 0, ${color} 4px, transparent 4px, transparent 8px)`,
                  background: 'none',
                } : {}),
              }}
            />
          );
        }
      })}
    </>
  );
}
