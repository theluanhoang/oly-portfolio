'use client';

import { useRef, useEffect, useLayoutEffect, useState } from 'react';
import type { CanvasElement, CanvasState } from '../admin/VisualEditorV3/types';
import { VISUAL_EDITOR_PREFIX } from '../admin/VisualEditorV3/types';
import { toEmbedUrl } from '../admin/VisualEditorV3/Elements/VideoElement';

// -------------------------------------------------------
// Parse serialized content
// -------------------------------------------------------
function parseVisualContent(value: string): CanvasState | null {
  if (!value?.startsWith(VISUAL_EDITOR_PREFIX)) return null;
  try {
    const json = value.slice(VISUAL_EDITOR_PREFIX.length);
    const parsed = JSON.parse(json);
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

// -------------------------------------------------------
// Desktop: absolute-positioned element (inside scaled canvas)
// -------------------------------------------------------
function RenderElementAbsolute({ el, yOffset = 0 }: { el: CanvasElement; yOffset?: number }) {
  const isTextEl = el.type === 'text' || el.type === 'heading';
  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    left: el.x,
    top: el.y + yOffset,
    width: el.width,
    // Text elements: height:'auto' so the wrapper always fits content.
    // yOffset pushes elements below a taller-than-saved text element down,
    // so nothing overlaps after measurement (see useLayoutEffect below).
    height: isTextEl ? 'auto' : el.height,
    minHeight: isTextEl ? el.height : undefined,
    zIndex: el.zIndex,
    opacity: el.style.opacity ?? 1,
    borderRadius: el.style.borderRadius ? `${el.style.borderRadius}px` : undefined,
    backgroundColor: isTextEl ? undefined : (el.style.backgroundColor || undefined),
    overflow: 'visible',
  };

  return <RenderElementContent el={el} style={baseStyle} />;
}

// -------------------------------------------------------
// Mobile: flow-layout element (stacked, full-width)
// -------------------------------------------------------
function RenderElementReflow({ el }: { el: CanvasElement }) {
  // Aspect ratio for images/video, min-height for others
  const isMedia = el.type === 'image' || el.type === 'embed';
  const aspectRatio = isMedia ? el.height / el.width : undefined;

  const baseStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    opacity: el.style.opacity ?? 1,
    borderRadius: el.style.borderRadius ? `${el.style.borderRadius}px` : undefined,
    backgroundColor: el.style.backgroundColor || undefined,
    overflow: 'hidden',
    // For media: preserve aspect ratio; for text: natural height
    ...(aspectRatio
      ? { paddingBottom: `${aspectRatio * 100}%` }
      : { minHeight: el.type === 'divider' ? el.height : undefined }),
  };

  if (isMedia) {
    // Use absolute inner for aspect-ratio trick
    return (
      <div style={baseStyle}>
        <div style={{ position: 'absolute', inset: 0 }}>
          <RenderElementContent el={el} style={{ position: 'relative', width: '100%', height: '100%' }} />
        </div>
      </div>
    );
  }

  return <RenderElementContent el={el} style={baseStyle} />;
}

// -------------------------------------------------------
// Shared content rendering (used by both layout modes)
// -------------------------------------------------------
function RenderElementContent({ el, style }: { el: CanvasElement; style: React.CSSProperties }) {
  if (el.type === 'text') {
    return (
      <div style={style}>
        <div
          // data-vis-element lets the viewer's useLayoutEffect find this node
          // after first render to measure the actual scrollHeight.
          data-vis-element={el.id}
          style={{
            fontFamily: el.style.fontFamily || 'inherit',
            fontSize: el.style.fontSize ? `${el.style.fontSize}px` : '16px',
            fontWeight: el.style.fontWeight || 'normal',
            fontStyle: el.style.fontStyle || 'normal',
            textDecoration: el.style.textDecoration || 'none',
            textAlign: (el.style.textAlign as React.CSSProperties['textAlign']) || 'left',
            lineHeight: el.style.lineHeight || 1.6,
            letterSpacing: el.style.letterSpacing ? `${el.style.letterSpacing}em` : 'normal',
            color: el.style.color || '#1e293b',
            backgroundColor: el.style.backgroundColor || undefined,
            padding: el.style.padding ? `${el.style.padding}px` : '8px',
            width: '100%',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
          dangerouslySetInnerHTML={{ __html: el.content }}
        />
      </div>
    );
  }

  if (el.type === 'heading') {
    const level = el.headingLevel ?? 1;
    const defaultSizes: Record<number, number> = { 1: 48, 2: 36, 3: 28, 4: 22 };
    const textStyle: React.CSSProperties = {
      fontFamily: el.style.fontFamily || 'inherit',
      fontSize: el.style.fontSize ? `${el.style.fontSize}px` : `${defaultSizes[level] || 36}px`,
      fontWeight: el.style.fontWeight || 'bold',
      fontStyle: el.style.fontStyle || 'normal',
      textAlign: (el.style.textAlign as React.CSSProperties['textAlign']) || 'left',
      lineHeight: el.style.lineHeight || 1.2,
      letterSpacing: el.style.letterSpacing ? `${el.style.letterSpacing}em` : 'normal',
      color: el.style.color || '#000000',
      // backgroundColor on inner tag, not wrapper — same reason as text elements.
      // No minHeight/height: let heading size to content like the editor does.
      backgroundColor: el.style.backgroundColor || undefined,
      padding: el.style.padding ? `${el.style.padding}px` : undefined,
      margin: 0,
      width: '100%',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
    };
    const sharedProps = { style: { margin: 0 }, dangerouslySetInnerHTML: { __html: el.content } };
    return (
      <div style={style} data-vis-element={el.id}>
        {level === 1 && <h1 {...sharedProps} style={{ ...textStyle, margin: 0 }} />}
        {level === 2 && <h2 {...sharedProps} style={{ ...textStyle, margin: 0 }} />}
        {level === 3 && <h3 {...sharedProps} style={{ ...textStyle, margin: 0 }} />}
        {level === 4 && <h4 {...sharedProps} style={{ ...textStyle, margin: 0 }} />}
      </div>
    );
  }

  if (el.type === 'image' && el.content) {
    return (
      <div style={style}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={el.content}
          alt={el.altText || ''}
          style={{
            width: '100%',
            height: '100%',
            objectFit: (el.style.objectFit as React.CSSProperties['objectFit']) || 'cover',
            display: 'block',
          }}
        />
      </div>
    );
  }

  if (el.type === 'divider') {
    return (
      <div style={style}>
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', height: '100%', padding: '0 8px' }}>
          <hr style={{
            width: '100%',
            border: 'none',
            borderTop: `${el.style.dividerThickness || 1}px ${el.style.dividerStyle || 'solid'} ${el.style.dividerColor || '#d1d5db'}`,
            margin: 0,
          }} />
        </div>
      </div>
    );
  }

  if (el.type === 'embed') {
    const src = toEmbedUrl(el.content || el.embedUrl || '');
    if (!src) return null;
    return (
      <div style={{ ...style, borderRadius: el.style.borderRadius ? `${el.style.borderRadius}px` : '4px', overflow: 'hidden' }}>
        <iframe
          src={src}
          title="YouTube video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
        />
      </div>
    );
  }

  return null;
}

// -------------------------------------------------------
// Main renderer
// -------------------------------------------------------
interface VisualContentRendererProps {
  content: string;
  /** Scale canvas to fit container width (default: true) */
  fluid?: boolean;
  className?: string;
  /** Mobile breakpoint in px — below this, reflow layout is used (default: 768) */
  mobileBreakpoint?: number;
}

export function VisualContentRenderer({
  content,
  fluid = true,
  className,
  mobileBreakpoint = 768,
}: VisualContentRendererProps) {
  const state = parseVisualContent(content);

  // Refs for fluid/desktop scaling
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  // Track whether we're in mobile reflow mode
  const [isMobile, setIsMobile] = useState(false);

  // -------------------------------------------------------------------
  // y-correction: after first render, measure actual heights of text
  // elements and push all elements below them down by the overflow delta.
  // useLayoutEffect fires before browser paint so the user never sees
  // the intermediate layout without corrections.
  // -------------------------------------------------------------------
  const [yCorrections, setYCorrections] = useState<Record<string, number>>({});

  useLayoutEffect(() => {
    if (!state || !innerRef.current || isMobile) return;

    // Sort elements top-to-bottom
    const sorted = [...state.elements].sort((a, b) => a.y - b.y);
    const corrections: Record<string, number> = {};
    let cumulativeDelta = 0;

    for (const el of sorted) {
      // Every element at or after this y gets shifted by accumulated delta
      if (cumulativeDelta > 0) {
        corrections[el.id] = cumulativeDelta;
      }
      // Measure text elements
      if (el.type === 'text' || el.type === 'heading') {
        const domEl = innerRef.current.querySelector<HTMLElement>(`[data-vis-element="${el.id}"]`);
        if (domEl) {
          const actualH = domEl.scrollHeight;
          const delta = Math.max(0, actualH - el.height);
          if (delta > 0) cumulativeDelta += delta;
        }
      }
    }

    // Avoid redundant state updates (prevents infinite loops)
    const changed = Object.keys(corrections).some(
      (id) => (yCorrections[id] ?? 0) !== corrections[id]
    ) || Object.keys(yCorrections).some((id) => !(id in corrections));

    if (changed) setYCorrections(corrections);
  // We intentionally run after every render so that font-load-triggered
  // reflows are also caught. state.elements identity is stable (parsed once).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, isMobile]);

  // Corrected canvas height accounts for text elements that rendered taller
  const correctedMinHeight = state
    ? Math.max(
        state.canvasHeight,
        ...state.elements.map((el) => el.y + (yCorrections[el.id] ?? 0) + el.height + 40)
      )
    : 0;

  // Responsive: watch container width, switch between scale and reflow
  useEffect(() => {
    if (!fluid || !state) return;
    const outer = outerRef.current;
    if (!outer) return;

    const update = () => {
      const containerWidth = outer.offsetWidth;
      const mobile = containerWidth < mobileBreakpoint;
      setIsMobile(mobile);

      if (!mobile) {
        // Desktop: scale inner canvas to fit container
        const inner = innerRef.current;
        if (!inner) return;
        const scale = containerWidth / state.canvasWidth;
        inner.style.transform = `scale(${scale})`;
        outer.style.paddingBottom = '0';
        outer.style.height = `${correctedMinHeight * scale}px`;
      } else {
        // Mobile: reset desktop scale styles
        outer.style.height = '';
        outer.style.paddingBottom = '';
      }
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(outer);
    return () => ro.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fluid, state?.canvasWidth, correctedMinHeight, mobileBreakpoint]);

  if (!state || state.elements.length === 0) return null;

  // Sort by zIndex for desktop, by Y position for mobile reflow
  const sortedDesktop = [...state.elements].sort((a, b) => a.zIndex - b.zIndex);
  const sortedMobile  = [...state.elements].sort((a, b) => a.y - b.y);

  if (fluid) {
    return (
      <div
        ref={outerRef}
        className={className}
        style={{
          width: '100%',
          background: state.background,
          // Desktop: paddingBottom aspect ratio (ResizeObserver overrides with exact px height)
          // Mobile: auto height — reflow content determines height
          ...(!isMobile ? {
            paddingBottom: `${(correctedMinHeight / state.canvasWidth) * 100}%`,
            position: 'relative' as const,
            overflow: 'hidden',
          } : {
            position: 'relative' as const,
          }),
        }}
      >
        {isMobile ? (
          /* ── Mobile: vertical reflow layout ── */
          <div
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              padding: '12px',
            }}
          >
            {sortedMobile.map((el) => (
              <RenderElementReflow key={el.id} el={el} />
            ))}
          </div>
        ) : (
          /* ── Desktop: scaled absolute canvas ── */
          <div
            ref={innerRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: state.canvasWidth,
              height: correctedMinHeight,
              transformOrigin: 'top left',
            }}
          >
            {sortedDesktop.map((el) => (
              <RenderElementAbsolute key={el.id} el={el} yOffset={yCorrections[el.id] ?? 0} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Fixed mode: exact canvas dimensions (no scaling)
  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: state.canvasWidth,
        height: correctedMinHeight,
        background: state.background,
        overflow: 'hidden',
      }}
    >
      {sortedDesktop.map((el) => (
        <RenderElementAbsolute key={el.id} el={el} />
      ))}
    </div>
  );
}
