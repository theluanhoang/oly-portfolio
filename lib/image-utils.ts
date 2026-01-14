/**
 * Client-side image compression and resizing utilities
 * Optimizes images before upload to reduce file size and improve upload speed
 */

interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1, for JPEG/WebP
  maxSizeMB?: number; // Target max file size in MB
  outputFormat?: 'jpeg' | 'webp' | 'png';
}

/**
 * Compress and/or resize an image file
 * Returns a new File object with optimized image data
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  const {
    maxWidth = 2048,
    maxHeight = 2048,
    quality = 0.85,
    maxSizeMB = 2,
    outputFormat = 'jpeg',
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          // Calculate new dimensions while maintaining aspect ratio
          let { width, height } = img;
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          // Create canvas and draw resized image
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Convert to blob with compression
          const mimeType = `image/${outputFormat}`;
          const initialQuality = quality;

          const tryCompress = (targetQuality: number): void => {
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error('Failed to compress image'));
                  return;
                }

                const sizeMB = blob.size / (1024 * 1024);

                // If still too large and quality can be reduced, try again
                if (sizeMB > maxSizeMB && targetQuality > 0.5) {
                  tryCompress(targetQuality - 0.1);
                  return;
                }

                // Create new File with optimized data
                const compressedFile = new File(
                  [blob],
                  file.name.replace(/\.[^.]+$/, `.${outputFormat}`),
                  {
                    type: mimeType,
                    lastModified: Date.now(),
                  }
                );

                // Debug log cho admin: cho biết file đã được resize/nén như thế nào
                // Ví dụ: từ 5.0 MB JPEG -> 1.2 MB JPEG, kích thước 4000x3000 -> 2048x1536
                // Lưu ý: hiện tại chúng ta đang output mặc định là JPEG, KHÔNG tự động chuyển sang WebP
                // trừ khi cấu hình options.outputFormat = 'webp'.
                console.log('[IMAGE OPTIMIZER] Compressed image', {
                  original: {
                    name: file.name,
                    type: file.type,
                    sizeMB: (file.size / (1024 * 1024)).toFixed(2),
                  },
                  output: {
                    name: compressedFile.name,
                    type: compressedFile.type,
                    sizeMB: sizeMB.toFixed(2),
                  },
                  resize: {
                    maxWidth,
                    maxHeight,
                    finalWidth: width,
                    finalHeight: height,
                  },
                  qualityUsed: targetQuality,
                });

                resolve(compressedFile);
              },
              mimeType,
              targetQuality
            );
          };

          tryCompress(initialQuality);
        } catch (error) {
          reject(error instanceof Error ? error : new Error('Image compression failed'));
        }
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Get image dimensions without loading full image
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Calculate upload speed (KB/s) from progress data
 */
export function calculateUploadSpeed(
  loaded: number,
  total: number,
  startTime: number
): number {
  const elapsed = (Date.now() - startTime) / 1000; // seconds
  if (elapsed === 0) return 0;
  const loadedKB = loaded / 1024;
  return Math.round((loadedKB / elapsed) * 10) / 10;
}
