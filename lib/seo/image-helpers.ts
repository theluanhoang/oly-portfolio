import { SEO_CONSTANTS } from './constants';

/**
 * Get image dimensions from URL or return default OG image dimensions
 * In production, you might want to fetch actual dimensions from the image
 * For now, we'll use sensible defaults based on image path patterns
 */
export async function getImageDimensions(
  imageUrl?: string
): Promise<{ width: number; height: number } | null> {
  if (!imageUrl) {
    return null;
  }

  // Default OG image dimensions
  const defaultDimensions = { width: 1200, height: 630 };

  // If it's the default OG image, return known dimensions
  if (imageUrl.includes('/assets/og-default.png')) {
    return defaultDimensions;
  }

  // For now, return default dimensions
  // In production, you could:
  // 1. Fetch image metadata from storage/CDN
  // 2. Use a service to get dimensions
  // 3. Store dimensions in database when image is uploaded
  return defaultDimensions;
}

/**
 * Generate descriptive alt text for project images
 */
export function generateProjectImageAlt(
  projectTitle: string,
  imageIndex: number,
  totalImages: number,
  imageType: 'hero' | 'gallery' = 'gallery'
): string {
  if (imageType === 'hero') {
    return `${projectTitle} - Hero image by OLY Studio`;
  }
  
  if (totalImages === 1) {
    return `${projectTitle} - Gallery image by OLY Studio`;
  }
  
  return `${projectTitle} - Gallery image ${imageIndex + 1} of ${totalImages} by OLY Studio`;
}

/**
 * Generate descriptive alt text for product images
 */
export function generateProductImageAlt(
  productName: string,
  imageIndex: number,
  totalImages: number,
  imageType: 'thumbnail' | 'gallery' = 'gallery'
): string {
  if (imageType === 'thumbnail') {
    return `${productName} - Product thumbnail by OLY Studio`;
  }
  
  if (totalImages === 1) {
    return `${productName} - Product image by OLY Studio`;
  }
  
  return `${productName} - Product image ${imageIndex + 1} of ${totalImages} by OLY Studio`;
}

/**
 * Validate if filename is descriptive (contains meaningful words, not just random characters)
 * Best practice: filenames should be descriptive, lowercase, hyphen-separated
 */
export function isDescriptiveFilename(filename: string): boolean {
  // Remove extension
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
  
  // Check if filename is too short (less than 3 characters)
  if (nameWithoutExt.length < 3) {
    return false;
  }
  
  // Check if filename contains only numbers or random characters
  // Good filenames should contain at least one letter
  if (!/[a-zA-Z]/.test(nameWithoutExt)) {
    return false;
  }
  
  // Check if filename is just a UUID or hash (long alphanumeric string without separators)
  // UUIDs typically have dashes, but hashes don't
  const isHashLike = /^[a-f0-9]{20,}$/i.test(nameWithoutExt);
  if (isHashLike) {
    return false;
  }
  
  return true;
}

/**
 * Suggest a better filename based on content
 */
export function suggestDescriptiveFilename(
  currentFilename: string,
  context: {
    title?: string;
    category?: string;
    type?: string;
  }
): string {
  const extension = currentFilename.match(/\.[^/.]+$/)?.at(0) || '.jpg';
  
  // Build descriptive name from context
  const parts: string[] = [];
  
  if (context.title) {
    parts.push(
      context.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 50)
    );
  }
  
  if (context.category) {
    parts.push(
      context.category
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
    );
  }
  
  if (context.type) {
    parts.push(
      context.type
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
    );
  }
  
  // If no context, use a generic name
  if (parts.length === 0) {
    parts.push('image');
  }
  
  return `${parts.join('-')}${extension}`;
}

/**
 * Build full image URL from relative path
 */
export function buildImageUrl(imagePath: string): string {
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Remove leading slash if present to avoid double slashes
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return `${SEO_CONSTANTS.SITE_URL}${cleanPath}`;
}
