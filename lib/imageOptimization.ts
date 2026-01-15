import sharp from 'sharp';

/**
 * Configuration for image optimization
 */
export interface ImageOptimizationConfig {
  /** Maximum width in pixels (default: 2048) */
  maxWidth?: number;
  /** Maximum height in pixels (default: 2048) */
  maxHeight?: number;
  /** Quality for JPEG/WebP (0-100, default: 80) */
  quality?: number;
  /** Whether to convert to WebP format (default: false for now, will implement in task 3) */
  convertToWebP?: boolean;
  /** Use progressive JPEG (default: true) - better perceived performance */
  progressive?: boolean;
  /** Strip metadata from image (default: true) - reduces file size and privacy concerns */
  stripMetadata?: boolean;
}

/**
 * Default configuration for image optimization
 */
const DEFAULT_CONFIG: Required<ImageOptimizationConfig> = {
  maxWidth: 2048,
  maxHeight: 2048,
  quality: 80,
  convertToWebP: false,
  progressive: true,
  stripMetadata: true,
};

/**
 * Calculate optimal quality based on original image size
 * Larger images can use slightly lower quality without noticeable difference
 */
function calculateOptimalQuality(
  originalWidth: number,
  originalHeight: number,
  baseQuality: number
): number {
  const megapixels = (originalWidth * originalHeight) / 1_000_000;
  
  // For very large images (>5MP), reduce quality slightly
  // For smaller images, keep higher quality
  if (megapixels > 5) {
    return Math.max(baseQuality - 5, 70); // Min 70 for large images
  } else if (megapixels > 2) {
    return baseQuality;
  } else {
    return Math.min(baseQuality + 5, 90); // Max 90 for small images
  }
}

/**
 * Get the output format after optimization
 * Useful for determining file extension
 */
export function getOutputFormat(
  originalFormat: string,
  convertToWebP: boolean
): 'jpeg' | 'png' | 'webp' | 'gif' {
  if (convertToWebP && originalFormat !== 'webp' && originalFormat !== 'gif') {
    return 'webp';
  }
  if (originalFormat === 'jpg' || originalFormat === 'jpeg') {
    return 'jpeg';
  }
  return originalFormat as 'png' | 'webp' | 'gif';
}

/**
 * Resize image to fit within max dimensions while maintaining aspect ratio
 * Applies compression and optimization based on image format
 * 
 * @param buffer - Image buffer
 * @param config - Optimization configuration
 * @returns Optimized image buffer
 */
export async function optimizeImage(
  buffer: Buffer,
  config: ImageOptimizationConfig = {}
): Promise<Buffer> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  let sharpInstance = sharp(buffer);
  
  // Get image metadata first (before any processing)
  const metadata = await sharpInstance.metadata();
  const { width, height, format } = metadata;
  
  if (!width || !height) {
    throw new Error('Unable to read image dimensions');
  }
  
  // Check if resize is needed
  const needsResize = width > finalConfig.maxWidth || height > finalConfig.maxHeight;
  
  if (needsResize) {
    // Resize while maintaining aspect ratio
    sharpInstance = sharpInstance.resize(finalConfig.maxWidth, finalConfig.maxHeight, {
      fit: 'inside', // Fit within dimensions, maintain aspect ratio
      withoutEnlargement: true, // Don't enlarge if smaller than max dimensions
      kernel: sharp.kernel.lanczos3, // High-quality resampling algorithm
    });
  }
  
  // Check if we should convert to WebP
  const shouldConvertToWebP = finalConfig.convertToWebP && format !== 'webp' && format !== 'gif';
  // Note: GIF không convert vì sẽ mất animation

  // Apply format-specific optimization with best practices
  if (shouldConvertToWebP) {
    // Convert PNG/JPEG to WebP for better compression
    // WebP typically reduces file size by 25-35% compared to JPEG/PNG at same quality
    const optimalQuality = calculateOptimalQuality(width, height, finalConfig.quality);
    
    const webpOptions: sharp.WebpOptions = {
      quality: optimalQuality,
      effort: 6, // Balance between compression and speed (0-6, higher = better compression but slower)
      smartSubsample: true, // Better quality for sharp edges
      nearLossless: false, // Use lossy compression for better file size
      lossless: false, // Use lossy for smaller files (can set to true for PNG if needed)
    };
    
    // For PNG with transparency, preserve alpha channel
    if (format === 'png' && metadata.hasAlpha) {
      webpOptions.lossless = false; // WebP lossy với alpha support
    }
    
    sharpInstance = sharpInstance.webp(webpOptions);
    if (!finalConfig.stripMetadata) {
      sharpInstance = sharpInstance.withMetadata();
    }
  } else if (format === 'jpeg' || format === 'jpg') {
    // Calculate adaptive quality based on original size
    const optimalQuality = calculateOptimalQuality(width, height, finalConfig.quality);
    
    const jpegOptions: sharp.JpegOptions = {
      quality: optimalQuality,
      progressive: finalConfig.progressive, // Progressive JPEG for better perceived performance
      mozjpeg: true, // Use mozjpeg encoder for better compression
      optimizeScans: true, // Optimize Huffman tables
      chromaSubsampling: '4:2:0', // Standard chroma subsampling (good balance)
    };
    
    // Best practice:
    // - Default: do NOT call withMetadata() => metadata will be stripped
    // - Only preserve metadata when explicitly requested
    sharpInstance = sharpInstance.jpeg(jpegOptions);
    if (!finalConfig.stripMetadata) {
      sharpInstance = sharpInstance.withMetadata();
    }
  } else if (format === 'png') {
    // PNG optimization
    const pngOptions: sharp.PngOptions = {
      compressionLevel: 9, // Maximum compression (0-9)
      adaptiveFiltering: true, // Better compression for most images
      palette: false, // Keep true color (can be optimized later if needed)
      quality: 100, // PNG is lossless, but sharp uses this for quantization
      effort: 10, // Maximum effort for optimization (0-10)
    };
    
    sharpInstance = sharpInstance.png(pngOptions);
    if (!finalConfig.stripMetadata) {
      sharpInstance = sharpInstance.withMetadata();
    }
  } else if (format === 'webp') {
    // WebP optimization
    const optimalQuality = calculateOptimalQuality(width, height, finalConfig.quality);
    
    const webpOptions: sharp.WebpOptions = {
      quality: optimalQuality,
      effort: 6, // Balance between compression and speed (0-6, higher = better compression but slower)
      smartSubsample: true, // Better quality for sharp edges
      nearLossless: false, // Use lossy compression for better file size
    };
    
    sharpInstance = sharpInstance.webp(webpOptions);
    if (!finalConfig.stripMetadata) {
      sharpInstance = sharpInstance.withMetadata();
    }
  } else if (format === 'gif') {
    // GIF optimization - preserve animation if present
    // Sharp handles animated GIFs automatically
    const gifOptions: sharp.GifOptions = {
      effort: 10, // Maximum effort for optimization
      reuse: true, // Reuse existing palette if possible
      colors: 256, // Maximum colors (can reduce for smaller files)
    };
    
    sharpInstance = sharpInstance.gif(gifOptions);
    if (!finalConfig.stripMetadata) {
      sharpInstance = sharpInstance.withMetadata();
    }
  }
  
  return await sharpInstance.toBuffer();
}

/**
 * Get image dimensions without processing the full image
 */
export async function getImageDimensions(buffer: Buffer): Promise<{ width: number; height: number }> {
  const metadata = await sharp(buffer).metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error('Unable to read image dimensions');
  }
  return {
    width: metadata.width,
    height: metadata.height,
  };
}
