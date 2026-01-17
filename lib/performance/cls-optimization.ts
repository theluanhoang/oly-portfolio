/**
 * CLS (Cumulative Layout Shift) Optimization Utilities
 */

/**
 * Calculate aspect ratio from width and height
 */
export function calculateAspectRatio(width: number, height: number): string {
  if (!width || !height) return 'auto';
  
  // Find greatest common divisor
  const gcd = (a: number, b: number): number => {
    return b === 0 ? a : gcd(b, a % b);
  };
  
  const divisor = gcd(width, height);
  const ratioWidth = width / divisor;
  const ratioHeight = height / divisor;
  
  return `${ratioWidth}/${ratioHeight}`;
}

/**
 * Get default dimensions for common image types
 */
export function getDefaultImageDimensions(type: 'hero' | 'thumbnail' | 'gallery'): {
  width: number;
  height: number;
} {
  switch (type) {
    case 'hero':
      return { width: 1399, height: 695 };
    case 'thumbnail':
      return { width: 1416, height: 528 };
    case 'gallery':
      return { width: 800, height: 600 };
    default:
      return { width: 1200, height: 630 };
  }
}

/**
 * Generate inline style for aspect ratio to prevent CLS
 */
export function generateAspectRatioStyle(
  width?: number,
  height?: number,
  type?: 'hero' | 'thumbnail' | 'gallery'
): React.CSSProperties {
  if (width && height) {
    return {
      aspectRatio: calculateAspectRatio(width, height),
    };
  }
  
  if (type) {
    const defaultDims = getDefaultImageDimensions(type);
    return {
      aspectRatio: calculateAspectRatio(defaultDims.width, defaultDims.height),
    };
  }
  
  return {};
}
