/**
 * useSmartGuides
 * Computes alignment guide lines (Figma-style snap lines) during drag.
 *
 * Compares dragging element bounding box against:
 *   1. Every static element (6 key points: left, centerX, right, top, centerY, bottom)
 *   2. The canvas/page boundaries (left=0, right=canvasWidth, centerX, top=0, bottom=canvasHeight, centerY)
 *
 * When any two key points match within SNAP_THRESHOLD we:
 *   1. Return a GuideLine to render
 *   2. Return a snap delta so the dragged elements auto-snap to exact alignment
 */

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GuideLine {
  orientation: 'horizontal' | 'vertical';
  /** Canvas-coordinate position of the line */
  position: number;
  /** How far along the perpendicular axis the line extends (for drawing) */
  start: number;
  end: number;
  /** Whether this guide is snapping to the page boundary (rendered differently) */
  isPage?: boolean;
}

export interface SmartGuidesResult {
  guides: GuideLine[];
  /** Apply these offsets to the dragged position to snap */
  snapX: number;
  snapY: number;
}

const SNAP_THRESHOLD = 6; // px — snap if within this distance

function keyPoints(r: Rect) {
  return {
    left:    r.x,
    centerX: r.x + r.width / 2,
    right:   r.x + r.width,
    top:     r.y,
    centerY: r.y + r.height / 2,
    bottom:  r.y + r.height,
  };
}

export function computeSmartGuides(
  draggingRects: Rect[],
  staticRects: Rect[],
  canvasWidth = 0,
  canvasHeight = 0,
): SmartGuidesResult {
  if (draggingRects.length === 0) {
    return { guides: [], snapX: 0, snapY: 0 };
  }

  // Bounding box of all dragging elements
  const boundLeft   = Math.min(...draggingRects.map((r) => r.x));
  const boundRight  = Math.max(...draggingRects.map((r) => r.x + r.width));
  const boundTop    = Math.min(...draggingRects.map((r) => r.y));
  const boundBottom = Math.max(...draggingRects.map((r) => r.y + r.height));
  const boundCX = (boundLeft + boundRight) / 2;
  const boundCY = (boundTop  + boundBottom) / 2;
  const draggingKP = { left: boundLeft, centerX: boundCX, right: boundRight, top: boundTop, centerY: boundCY, bottom: boundBottom };

  const guides: GuideLine[] = [];
  let snapX = 0;
  let snapY = 0;
  let bestDistX = SNAP_THRESHOLD + 1;
  let bestDistY = SNAP_THRESHOLD + 1;

  // ── X-axis pairs (vertical guide lines) ──────────────────────────────────
  const xPairs: Array<[keyof typeof draggingKP, number, boolean]> = [];
  const yPairs: Array<[keyof typeof draggingKP, number, boolean]> = [];

  // Page boundary X anchors
  if (canvasWidth > 0) {
    const pageCX = canvasWidth / 2;
    xPairs.push(['left',    0,          true]);
    xPairs.push(['centerX', 0,          true]);
    xPairs.push(['right',   0,          true]);
    xPairs.push(['left',    pageCX,     true]);
    xPairs.push(['centerX', pageCX,     true]);
    xPairs.push(['right',   pageCX,     true]);
    xPairs.push(['left',    canvasWidth, true]);
    xPairs.push(['centerX', canvasWidth, true]);
    xPairs.push(['right',   canvasWidth, true]);
  }
  // Page boundary Y anchors
  if (canvasHeight > 0) {
    const pageCY = canvasHeight / 2;
    yPairs.push(['top',     0,           true]);
    yPairs.push(['centerY', 0,           true]);
    yPairs.push(['bottom',  0,           true]);
    yPairs.push(['top',     pageCY,      true]);
    yPairs.push(['centerY', pageCY,      true]);
    yPairs.push(['bottom',  pageCY,      true]);
    yPairs.push(['top',     canvasHeight, true]);
    yPairs.push(['centerY', canvasHeight, true]);
    yPairs.push(['bottom',  canvasHeight, true]);
  }

  // Helpers to process static element rects
  const processStaticRect = (staticRect: Rect, isPage: boolean) => {
    const sk = keyPoints(staticRect);

    // Vertical (X-axis)
    const xChecks: Array<[keyof typeof draggingKP, keyof typeof sk]> = [
      ['left',    'left'],   ['left',    'centerX'], ['left',    'right'],
      ['centerX', 'left'],   ['centerX', 'centerX'], ['centerX', 'right'],
      ['right',   'left'],   ['right',   'centerX'], ['right',   'right'],
    ];
    for (const [dk, sk2] of xChecks) {
      const dist = Math.abs(draggingKP[dk] - sk[sk2]);
      if (dist <= SNAP_THRESHOLD) {
        const lineX = sk[sk2];
        if (dist < bestDistX) {
          bestDistX = dist;
          snapX = lineX - draggingKP[dk];
        }
        const lineTop    = Math.min(boundTop, staticRect.y);
        const lineBottom = Math.max(boundBottom, staticRect.y + staticRect.height);
        if (!guides.find((g) => g.orientation === 'vertical' && g.position === lineX)) {
          guides.push({ orientation: 'vertical', position: lineX, start: lineTop, end: lineBottom, isPage });
        }
      }
    }

    // Horizontal (Y-axis)
    const yChecks: Array<[keyof typeof draggingKP, keyof typeof sk]> = [
      ['top',     'top'],    ['top',     'centerY'], ['top',     'bottom'],
      ['centerY', 'top'],    ['centerY', 'centerY'], ['centerY', 'bottom'],
      ['bottom',  'top'],    ['bottom',  'centerY'], ['bottom',  'bottom'],
    ];
    for (const [dk, sk2] of yChecks) {
      const dist = Math.abs(draggingKP[dk] - sk[sk2]);
      if (dist <= SNAP_THRESHOLD) {
        const lineY = sk[sk2];
        if (dist < bestDistY) {
          bestDistY = dist;
          snapY = lineY - draggingKP[dk];
        }
        const lineLeft  = Math.min(boundLeft, staticRect.x);
        const lineRight = Math.max(boundRight, staticRect.x + staticRect.width);
        if (!guides.find((g) => g.orientation === 'horizontal' && g.position === lineY)) {
          guides.push({ orientation: 'horizontal', position: lineY, start: lineLeft, end: lineRight, isPage });
        }
      }
    }
  };

  // Process page boundary anchors as virtual "zero-size" rects at each anchor
  if (canvasWidth > 0) {
    const pageCX = canvasWidth / 2;
    // Treat page left/center/right edges as 0-width vertical anchors
    [0, pageCX, canvasWidth].forEach((x) => {
      const dist = Math.min(
        Math.abs(draggingKP.left    - x),
        Math.abs(draggingKP.centerX - x),
        Math.abs(draggingKP.right   - x),
      );
      if (dist <= SNAP_THRESHOLD) {
        // Find which dragging key snaps to this x
        const snappingKey = (['left', 'centerX', 'right'] as const).find(
          (k) => Math.abs(draggingKP[k] - x) === dist
        )!;
        const lineX = x;
        if (dist < bestDistX) {
          bestDistX = dist;
          snapX = lineX - draggingKP[snappingKey];
        }
        if (!guides.find((g) => g.orientation === 'vertical' && g.position === lineX)) {
          guides.push({
            orientation: 'vertical',
            position: lineX,
            start: 0,
            end: canvasHeight || boundBottom,
            isPage: true,
          });
        }
      }
    });
  }

  if (canvasHeight > 0) {
    const pageCY = canvasHeight / 2;
    [0, pageCY, canvasHeight].forEach((y) => {
      const dist = Math.min(
        Math.abs(draggingKP.top     - y),
        Math.abs(draggingKP.centerY - y),
        Math.abs(draggingKP.bottom  - y),
      );
      if (dist <= SNAP_THRESHOLD) {
        const snappingKey = (['top', 'centerY', 'bottom'] as const).find(
          (k) => Math.abs(draggingKP[k] - y) === dist
        )!;
        const lineY = y;
        if (dist < bestDistY) {
          bestDistY = dist;
          snapY = lineY - draggingKP[snappingKey];
        }
        if (!guides.find((g) => g.orientation === 'horizontal' && g.position === lineY)) {
          guides.push({
            orientation: 'horizontal',
            position: lineY,
            start: 0,
            end: canvasWidth || boundRight,
            isPage: true,
          });
        }
      }
    });
  }

  // Process static element rects (other elements on canvas)
  for (const staticRect of staticRects) {
    processStaticRect(staticRect, false);
  }

  return { guides, snapX, snapY };
}
