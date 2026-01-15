/**
 * Image Upload Validation
 * Comprehensive validation for image uploads including:
 * - File type validation (MIME type + file signature)
 * - File size limits
 * - Image dimensions limits
 * - File extension validation
 */

import sharp from 'sharp';

export interface ImageUploadValidationResult {
  valid: boolean;
  error?: string;
}

export interface ImageUploadConstraints {
  /** Maximum file size in bytes (default: 50MB) */
  maxFileSize?: number;
  /** Maximum image width in pixels (default: 10000) */
  maxWidth?: number;
  /** Maximum image height in pixels (default: 10000) */
  maxHeight?: number;
  /** Allowed MIME types (default: image/jpeg, image/png, image/webp, image/gif) */
  allowedMimeTypes?: string[];
  /** Allowed file extensions (default: jpg, jpeg, png, webp, gif) */
  allowedExtensions?: string[];
}

const DEFAULT_CONSTRAINTS: Required<ImageUploadConstraints> = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  maxWidth: 10000, // Very large limit, will be resized anyway
  maxHeight: 10000,
  allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
};

/**
 * Validate file extension
 */
function validateFileExtension(filename: string, allowedExtensions: string[]): boolean {
  const extension = filename.split('.').pop()?.toLowerCase();
  if (!extension) return false;
  return allowedExtensions.includes(extension);
}

/**
 * Validate MIME type
 */
function validateMimeType(mimeType: string, allowedMimeTypes: string[]): boolean {
  return allowedMimeTypes.includes(mimeType.toLowerCase());
}

/**
 * Validate file size
 */
function validateFileSize(fileSize: number, maxSize: number): boolean {
  return fileSize > 0 && fileSize <= maxSize;
}

/**
 * Validate image dimensions using sharp
 */
async function validateImageDimensions(
  buffer: Buffer,
  maxWidth: number,
  maxHeight: number
): Promise<{ valid: boolean; width?: number; height?: number; error?: string }> {
  try {
    const metadata = await sharp(buffer).metadata();
    const { width, height } = metadata;

    if (!width || !height) {
      return {
        valid: false,
        error: 'Unable to read image dimensions. File may be corrupted.',
      };
    }

    if (width > maxWidth || height > maxHeight) {
      return {
        valid: false,
        width,
        height,
        error: `Image dimensions (${width}x${height}) exceed maximum allowed (${maxWidth}x${maxHeight}px).`,
      };
    }

    return { valid: true, width, height };
  } catch {
    return {
      valid: false,
      error: 'Invalid image file. File may be corrupted or not a valid image.',
    };
  }
}

/**
 * Validate file signature (magic bytes) to ensure file type matches extension
 * This prevents fake file extensions
 */
function validateFileSignature(buffer: Buffer, mimeType: string): boolean {
  // Check first few bytes (magic numbers) to verify file type
  const signature = buffer.slice(0, 12);

  // JPEG: FF D8 FF
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    return signature[0] === 0xff && signature[1] === 0xd8 && signature[2] === 0xff;
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (mimeType === 'image/png') {
    return (
      signature[0] === 0x89 &&
      signature[1] === 0x50 &&
      signature[2] === 0x4e &&
      signature[3] === 0x47
    );
  }

  // WebP: RIFF ... WEBP
  if (mimeType === 'image/webp') {
    return (
      signature[0] === 0x52 &&
      signature[1] === 0x49 &&
      signature[2] === 0x46 &&
      signature[3] === 0x46 &&
      signature[8] === 0x57 &&
      signature[9] === 0x45 &&
      signature[10] === 0x42 &&
      signature[11] === 0x50
    );
  }

  // GIF: GIF87a or GIF89a
  if (mimeType === 'image/gif') {
    const gifHeader = signature.toString('ascii', 0, 6);
    return gifHeader === 'GIF87a' || gifHeader === 'GIF89a';
  }

  // If we can't verify signature, assume valid (some formats may vary)
  return true;
}

/**
 * Comprehensive image upload validation
 * 
 * @param file - File object from upload
 * @param buffer - File buffer (optional, for server-side validation)
 * @param constraints - Validation constraints
 * @returns Validation result
 */
export async function validateImageUpload(
  file: File,
  buffer?: Buffer,
  constraints: ImageUploadConstraints = {}
): Promise<ImageUploadValidationResult> {
  const finalConstraints = { ...DEFAULT_CONSTRAINTS, ...constraints };

  // 1. Validate file extension
  if (!validateFileExtension(file.name, finalConstraints.allowedExtensions)) {
    return {
      valid: false,
      error: `Invalid file extension. Allowed extensions: ${finalConstraints.allowedExtensions.join(', ')}`,
    };
  }

  // 2. Validate MIME type
  if (!validateMimeType(file.type, finalConstraints.allowedMimeTypes)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${finalConstraints.allowedMimeTypes.join(', ')}`,
    };
  }

  // 3. Validate file size
  if (!validateFileSize(file.size, finalConstraints.maxFileSize)) {
    const maxSizeMB = (finalConstraints.maxFileSize / 1024 / 1024).toFixed(1);
    return {
      valid: false,
      error: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed (${maxSizeMB}MB)`,
    };
  }

  // 4. Validate file signature (if buffer provided)
  if (buffer) {
    if (!validateFileSignature(buffer, file.type)) {
      return {
        valid: false,
        error: 'File signature does not match file type. File may be corrupted or fake.',
      };
    }

    // 5. Validate image dimensions (if buffer provided)
    const dimensionResult = await validateImageDimensions(
      buffer,
      finalConstraints.maxWidth,
      finalConstraints.maxHeight
    );

    if (!dimensionResult.valid) {
      return {
        valid: false,
        error: dimensionResult.error || 'Invalid image dimensions',
      };
    }
  }

  return { valid: true };
}

/**
 * Client-side validation (lightweight, no buffer processing)
 * Use this before uploading to provide immediate feedback
 */
export function validateImageUploadClient(
  file: File,
  constraints: ImageUploadConstraints = {}
): ImageUploadValidationResult {
  const finalConstraints = { ...DEFAULT_CONSTRAINTS, ...constraints };

  // 1. Validate file extension
  if (!validateFileExtension(file.name, finalConstraints.allowedExtensions)) {
    return {
      valid: false,
      error: `Invalid file extension. Allowed: ${finalConstraints.allowedExtensions.join(', ')}`,
    };
  }

  // 2. Validate MIME type
  if (!validateMimeType(file.type, finalConstraints.allowedMimeTypes)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${finalConstraints.allowedMimeTypes.join(', ')}`,
    };
  }

  // 3. Validate file size
  if (!validateFileSize(file.size, finalConstraints.maxFileSize)) {
    const maxSizeMB = (finalConstraints.maxFileSize / 1024 / 1024).toFixed(1);
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
    return {
      valid: false,
      error: `File too large (${fileSizeMB}MB). Maximum: ${maxSizeMB}MB`,
    };
  }

  return { valid: true };
}
