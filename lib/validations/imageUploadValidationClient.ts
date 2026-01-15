/**
 * Client-side Image Upload Validation
 * Lightweight validation for client-side use (no server dependencies)
 * This file does NOT import sharp or any server-only modules
 */

export interface ImageUploadValidationResult {
  valid: boolean;
  error?: string;
}

export interface ImageUploadConstraints {
  /** Maximum file size in bytes (default: 50MB) */
  maxFileSize?: number;
  /** Allowed MIME types (default: image/jpeg, image/png, image/webp, image/gif) */
  allowedMimeTypes?: string[];
  /** Allowed file extensions (default: jpg, jpeg, png, webp, gif) */
  allowedExtensions?: string[];
}

const DEFAULT_CONSTRAINTS: Required<Omit<ImageUploadConstraints, 'maxWidth' | 'maxHeight'>> = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
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
