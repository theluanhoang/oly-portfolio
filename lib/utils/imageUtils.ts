/**
 * Image Utilities
 * Helper functions for image optimization and processing
 */

/**
 * Generate a blur placeholder data URL from an image
 * This creates a tiny, blurred version of the image for progressive loading
 */
export async function generateBlurPlaceholder(imageUrl: string): Promise<string> {
  try {
    // Create a small canvas to generate blur placeholder
    const canvas = document.createElement('canvas');
    canvas.width = 20;
    canvas.height = 20;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return getDefaultBlurPlaceholder();
    }

    // Load image
    const img = new Image();
    img.crossOrigin = 'anonymous';

    return new Promise((resolve) => {
      img.onload = () => {
        // Draw scaled down version
        ctx.drawImage(img, 0, 0, 20, 20);
        // Get image data and create blur effect
        const imageData = ctx.getImageData(0, 0, 20, 20);
        // Simple blur by averaging pixels
        const blurred = simpleBlur(imageData, 2);
        ctx.putImageData(blurred, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.1));
      };

      img.onerror = () => {
        resolve(getDefaultBlurPlaceholder());
      };

      img.src = imageUrl;
    });
  } catch {
    return getDefaultBlurPlaceholder();
  }
}

/**
 * Simple box blur implementation
 */
function simpleBlur(imageData: ImageData, radius: number): ImageData {
  const data = new Uint8ClampedArray(imageData.data);
  const width = imageData.width;
  const height = imageData.height;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0, a = 0, count = 0;

      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;

          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const idx = (ny * width + nx) * 4;
            r += data[idx];
            g += data[idx + 1];
            b += data[idx + 2];
            a += data[idx + 3];
            count++;
          }
        }
      }

      const idx = (y * width + x) * 4;
      data[idx] = r / count;
      data[idx + 1] = g / count;
      data[idx + 2] = b / count;
      data[idx + 3] = a / count;
    }
  }

  return new ImageData(data, width, height);
}

/**
 * Get default blur placeholder (simple gray gradient)
 */
export function getDefaultBlurPlaceholder(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 20;
  canvas.height = 20;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="20" height="20"%3E%3Crect fill="%23e0e0e0" width="20" height="20"/%3E%3C/svg%3E';
  }

  // Create a simple gradient
  const gradient = ctx.createLinearGradient(0, 0, 20, 20);
  gradient.addColorStop(0, '#e0e0e0');
  gradient.addColorStop(1, '#f0f0f0');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 20, 20);

  return canvas.toDataURL('image/jpeg', 0.1);
}

/**
 * Check if image is in viewport (for manual lazy loading)
 */
export function isInViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Preload image
 */
export function preloadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Client-side image compression options
 */
export interface CompressImageOptions {
  /** Maximum width in pixels (maintains aspect ratio) */
  maxWidth?: number;
  /** Maximum height in pixels (maintains aspect ratio) */
  maxHeight?: number;
  /** Starting JPEG quality (0-1, default: 0.85) - will auto-adjust to minimize size */
  quality?: number;
  /** Minimum quality threshold (default: 0.6) - won't go below this to maintain quality */
  minQuality?: number;
  /** Output format ('jpeg' | 'webp' | 'png') */
  outputFormat?: 'jpeg' | 'webp' | 'png';
}

/**
 * Check if browser supports WebP format
 */
function supportsWebP(): boolean {
  if (typeof window === 'undefined') return false;
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
}

/**
 * Prepare image for upload - compresses if needed
 * This is a convenience wrapper that handles compression logic consistently
 */
export async function prepareImageForUpload(file: File): Promise<File> {
  const originalSizeMB = file.size / (1024 * 1024);
  
  // Compress if larger than 500KB (compressImageClient has its own threshold of 1MB for skip)
  if (originalSizeMB > 0.5) {
    return await compressImageClient(file, {
      maxWidth: 2048,
      maxHeight: 2048,
      quality: 0.85,
      minQuality: 0.6,
    });
  }
  
  return file;
}

/**
 * Compress image on client side before upload
 * Automatically reduces file size as much as possible while maintaining good quality
 * Uses intelligent compression: WebP if supported, progressive quality reduction
 */
export async function compressImageClient(
  file: File,
  options: CompressImageOptions = {}
): Promise<File> {
  const {
    maxWidth = 2048,
    maxHeight = 2048,
    quality = 0.85,
    minQuality = 0.6,
    outputFormat,
  } = options;

  // Auto-detect best format: WebP if supported, otherwise JPEG
  const useWebP = supportsWebP();
  const finalFormat = outputFormat || (useWebP ? 'webp' : 'jpeg');

  return new Promise((resolve, reject) => {
    const originalSizeMB = file.size / (1024 * 1024);
    
    // Skip compression for already small files (unless PNG/WebP which can be optimized)
    if (originalSizeMB < 1 && file.type !== 'image/png' && file.type !== 'image/webp') {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        try {
          // Calculate new dimensions maintaining aspect ratio
          let { width, height } = img;
          const aspectRatio = width / height;

          if (width > maxWidth) {
            width = maxWidth;
            height = width / aspectRatio;
          }

          if (height > maxHeight) {
            height = maxHeight;
            width = height * aspectRatio;
          }

          // Create canvas
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          // Draw image to canvas
          ctx.drawImage(img, 0, 0, width, height);

          // Progressive compression: reduce quality until size reduction plateaus
          const compressAndCreateFile = async (): Promise<void> => {
            const mimeType = 
              finalFormat === 'webp' ? 'image/webp' :
              finalFormat === 'png' ? 'image/png' :
              'image/jpeg';

            const tryCompress = (testQuality: number): Promise<Blob> => {
              return new Promise((resolve, reject) => {
                canvas.toBlob(
                  (blob) => {
                    if (!blob) {
                      reject(new Error('Failed to compress image'));
                      return;
                    }
                    resolve(blob);
                  },
                  mimeType,
                  testQuality
                );
              });
            };

            // Start with high quality and progressively reduce to minimize size
            let currentQuality = quality;
            let bestBlob: Blob | null = null;
            let bestQualityUsed = quality;
            let previousSize = Infinity;
            const qualityStep = 0.05; // Reduce by 5% each step
            const minSizeReduction = 0.02; // Stop if size reduction is less than 2% per step

            // Try progressively lower quality until we find the optimal point
            while (currentQuality >= minQuality) {
              try {
                const testBlob = await tryCompress(currentQuality);
                const sizeReduction = (previousSize - testBlob.size) / previousSize;

                // If this is the best so far, save it
                if (!bestBlob || testBlob.size < bestBlob.size) {
                  bestBlob = testBlob;
                  bestQualityUsed = currentQuality;
                }

                // If size reduction is minimal, we've reached optimal point
                if (previousSize !== Infinity && sizeReduction < minSizeReduction) {
                  break;
                }

                previousSize = testBlob.size;
                currentQuality -= qualityStep;
              } catch {
                // If compression fails, use best we found so far
                break;
              }
            }

            // Ensure we have a blob
            if (!bestBlob) {
              try {
                bestBlob = await tryCompress(minQuality);
                bestQualityUsed = minQuality;
              } catch {
                reject(new Error('Failed to compress image'));
                return;
              }
            }

            // Create new File object with compressed blob
            const extension = finalFormat === 'jpeg' ? 'jpg' : finalFormat;
            const compressedFile = new File(
              [bestBlob],
              file.name.replace(/\.[^/.]+$/, `.${extension}`),
              {
                type: mimeType,
                lastModified: Date.now(),
              }
            );

            // Log compression results
            const originalSizeMB = file.size / (1024 * 1024);
            const compressedSizeMB = bestBlob.size / (1024 * 1024);
            const compressionRatio = ((1 - compressedSizeMB / originalSizeMB) * 100).toFixed(1);
            const sizeReductionMB = (originalSizeMB - compressedSizeMB).toFixed(2);

            console.log(`📸 Image Compression: ${file.name}`);
            console.log(`   Original: ${originalSizeMB.toFixed(2)} MB (${file.size.toLocaleString()} bytes)`);
            console.log(`   Compressed: ${compressedSizeMB.toFixed(2)} MB (${bestBlob.size.toLocaleString()} bytes)`);
            console.log(`   Reduction: ${sizeReductionMB} MB (${compressionRatio}% smaller)`);
            console.log(`   Format: ${finalFormat.toUpperCase()}, Quality: ${(bestQualityUsed * 100).toFixed(0)}%`);
            console.log(`   Dimensions: ${width}x${height}px`);

            resolve(compressedFile);
          };

          compressAndCreateFile();
        } catch (error) {
          reject(error instanceof Error ? error : new Error('Compression failed'));
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      if (typeof e.target?.result === 'string') {
        img.src = e.target.result;
      } else if (e.target?.result instanceof ArrayBuffer) {
        const blob = new Blob([e.target.result], { type: file.type });
        img.src = URL.createObjectURL(blob);
      } else {
        reject(new Error('Invalid file data'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}
