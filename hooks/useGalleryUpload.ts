"use client";

import type { UniqueIdentifier } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useRef, useState } from "react";
import { compressImage, calculateUploadSpeed } from "@/lib/image-utils";

interface GalleryItem {
  url: string;
  assetId: string;
  originalName: string;
}

export interface UploadProgressItem {
  status: 'uploading' | 'compressing' | 'success' | 'error';
  progress?: number;
  error?: string;
  speed?: number; // KB/s
  originalSize?: number;
  compressedSize?: number;
  timeElapsed?: number; // ms
}

interface UseGalleryUploadOptions {
  onUploadSuccess?: (result: { urls: string[]; assetIds: string[] }) => void;
  onError?: (error: string) => void;
  onReorder?: (result: { urls: string[]; assetIds: string[] }) => void;
}

interface UseGalleryUploadReturn {
  galleryUrls: (string | GalleryItem)[];
  heroImageIndex: number;
  uploading: boolean;
  uploadProgress: Record<string, UploadProgressItem>;
  isDragging: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => Promise<void>;
  handleClick: () => void;
  handleGalleryUrlRemove: (index: number, onRemove?: (urls: string[]) => void) => void;
  handleSetHeroImage: (index: number) => void;
  handleReorder: (activeId: UniqueIdentifier, overId: UniqueIdentifier) => void;
  reset: () => void;
  getGalleryUrlStrings: () => string[];
  getGalleryAssetIds: () => string[];
  setGalleryUrls: (urls: string[]) => void;
  setHeroImageIndex: (index: number) => void;
}

export function useGalleryUpload({ onUploadSuccess, onError, onReorder }: UseGalleryUploadOptions): UseGalleryUploadReturn {
  const [galleryUrls, setGalleryUrls] = useState<(string | GalleryItem)[]>([]);
  const [uploadedFileNames, setUploadedFileNames] = useState<Set<string>>(new Set());
  const [heroImageIndex, setHeroImageIndex] = useState<number>(0);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, UploadProgressItem>>({});
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getItemId = (item: string | GalleryItem): string => typeof item === 'string' ? item : item.url;

  const uploadFiles = async (files: FileList | File[]): Promise<void> => {
    if (files.length === 0) return;

    const fileArray = Array.from(files);
    
    const imageFiles = fileArray.filter((file: File) => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      onError?.('Vui lòng chọn file ảnh (JPEG, PNG, WebP, GIF)');
      return;
    }

    // Client-side size check for better UX and to avoid Cloudinary 400 errors.
    // Keep in sync với Cloudinary upload preset (hiện 10MB).
    const MAX_SIZE_BYTES = 10 * 1024 * 1024;
    const oversized = imageFiles.filter((file) => file.size > MAX_SIZE_BYTES);
    if (oversized.length > 0) {
      const first = oversized[0];
      const sizeMb = first.size / (1024 * 1024);
      onError?.(
        `Một số ảnh quá lớn (ví dụ: "${first.name}" ~ ${sizeMb.toFixed(
          1,
        )}MB). Vui lòng chọn ảnh dưới 10MB mỗi ảnh để đảm bảo tốc độ tải.`,
      );

      // Đánh dấu các file quá lớn trong progress để user thấy rõ file nào lỗi.
      setUploadProgress((prev) => {
        const next = { ...prev };
        oversized.forEach((file) => {
          next[file.name] = {
            status: 'error',
            error: 'Ảnh vượt quá 10MB. Vui lòng chọn ảnh nhẹ hơn.',
          };
        });
        return next;
      });

      // Chỉ tiếp tục upload các file hợp lệ về kích thước.
      const validFiles = imageFiles.filter((file) => file.size <= MAX_SIZE_BYTES);
      if (validFiles.length === 0) {
        return;
      }
      // Ghi đè lại danh sách file sẽ upload.
      files = validFiles as unknown as FileList;
    }

    const newFiles = imageFiles.filter((file: File) => {
      return !uploadedFileNames.has(file.name);
    });

    if (newFiles.length === 0) {
      return;
    }

    setUploading(true);
    setIsDragging(false);

    try {
      const uploadPromises = newFiles.map(async (file: File): Promise<GalleryItem> => {
        const uploadStartTime = Date.now();
        const originalSize = file.size;

        setUploadProgress((prev) => ({
          ...prev,
          [file.name]: { 
            status: 'compressing', 
            progress: 0,
            originalSize,
          },
        }));

        try {
          // 0) Compress image trước khi upload (nếu cần)
          let fileToUpload = file;
          const shouldCompress = file.size > 500 * 1024; // > 500KB
          
          if (shouldCompress) {
            try {
              fileToUpload = await compressImage(file, {
                maxWidth: 2048,
                maxHeight: 2048,
                quality: 0.85,
                maxSizeMB: 2,
                outputFormat: 'jpeg',
              });
              
              setUploadProgress((prev) => ({
                ...prev,
                [file.name]: { 
                  ...prev[file.name],
                  compressedSize: fileToUpload.size,
                },
              }));
            } catch (compressError) {
              console.warn(`Failed to compress ${file.name}, using original:`, compressError);
              // Fallback to original file if compression fails
            }
          }

          // 1) Lấy chữ ký upload từ server
          setUploadProgress((prev) => ({
            ...prev,
            [file.name]: { 
              ...prev[file.name],
              status: 'uploading',
              progress: 5,
            },
          }));

          const signRes = await fetch('/api/upload/sign', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ filename: fileToUpload.name }),
          });

          if (!signRes.ok) {
            const errorData = await signRes.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to get upload signature');
          }

          const {
            cloudName,
            apiKey,
            timestamp,
            folder,
            publicId,
            uploadPreset,
            signature,
          } = (await signRes.json()) as {
            cloudName: string;
            apiKey: string;
            timestamp: number;
            folder: string;
            publicId: string;
            uploadPreset: string | null;
            signature: string;
          };

          if (!cloudName || !apiKey || !signature) {
            throw new Error('Invalid upload signature response');
          }

          // 2) Upload trực tiếp lên Cloudinary với progress tracking
          const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
          const formData = new FormData();
          formData.append('file', fileToUpload);
          formData.append('api_key', apiKey);
          formData.append('timestamp', String(timestamp));
          formData.append('signature', signature);
          formData.append('folder', folder);
          formData.append('public_id', publicId);
          if (uploadPreset) {
            formData.append('upload_preset', uploadPreset);
          }

          // Use XMLHttpRequest for progress tracking
          const uploadRes = await new Promise<{
            secure_url?: string;
            public_id?: string;
            version?: number;
            bytes?: number;
            width?: number;
            height?: number;
            resource_type?: string;
            format?: string;
            error?: { message?: string };
          }>((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener('progress', (e) => {
              if (e.lengthComputable) {
                const percentComplete = Math.min(95, 10 + (e.loaded / e.total) * 85);
                const speed = calculateUploadSpeed(e.loaded, e.total, uploadStartTime);
                
                setUploadProgress((prev) => ({
                  ...prev,
                  [file.name]: {
                    ...prev[file.name],
                    progress: percentComplete,
                    speed,
                    timeElapsed: Date.now() - uploadStartTime,
                  },
                }));
              }
            });

            xhr.addEventListener('load', () => {
              try {
                const result = JSON.parse(xhr.responseText);
                if (xhr.status === 200) {
                  resolve(result);
                } else {
                  reject(new Error(result?.error?.message || 'Cloudinary upload failed'));
                }
              } catch {
                reject(new Error('Invalid Cloudinary response'));
              }
            });

            xhr.addEventListener('error', () => {
              reject(new Error('Cloudinary upload failed'));
            });

            xhr.open('POST', cloudinaryUrl);
            xhr.send(formData);
          });

          if (!uploadRes.public_id) {
            throw new Error('Cloudinary upload did not return public_id');
          }

          // 3) Tạo MediaAsset trên backend
          setUploadProgress((prev) => ({
            ...prev,
            [file.name]: {
              ...prev[file.name],
              progress: 95,
            },
          }));

          const metaRes = await fetch('/api/media-assets', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              provider: 'cloudinary',
              publicId: uploadRes.public_id,
              version: uploadRes.version,
              mimeType:
                uploadRes.resource_type === 'image'
                  ? uploadRes.format
                  : fileToUpload.type,
              width: uploadRes.width,
              height: uploadRes.height,
              bytes: uploadRes.bytes,
            }),
          });

          const meta = await metaRes.json() as {
            success?: boolean;
            assetId?: string;
            url?: string | null;
            error?: string;
          };

          if (!metaRes.ok || !meta.success || !meta.assetId) {
            throw new Error(meta.error || 'Failed to create media asset');
          }

          const totalTime = Date.now() - uploadStartTime;

          setUploadProgress((prev) => ({
            ...prev,
            [file.name]: { 
              status: 'success', 
              progress: 100,
              timeElapsed: totalTime,
            },
          }));

          return {
            url: meta.url || uploadRes.secure_url || '',
            assetId: meta.assetId,
            originalName: file.name,
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          setUploadProgress((prev) => ({
            ...prev,
            [file.name]: { status: 'error', error: errorMessage },
          }));
          throw error;
        }
      });

      const uploadedItems = await Promise.all(uploadPromises);
      const newUrls = uploadedItems.map(item => item.url);
      const newAssetIds = uploadedItems.map(item => item.assetId);
      
      setGalleryUrls((prev) => {
        const updated = [...prev, ...uploadedItems];
        if (prev.length === 0 && updated.length > 0) {
          setHeroImageIndex(0);
        }
        return updated;
      });
      
      setUploadedFileNames((prev) => {
        const newSet = new Set(prev);
        uploadedItems.forEach(item => newSet.add(item.originalName));
        return newSet;
      });

      onUploadSuccess?.({ urls: newUrls, assetIds: newAssetIds });
    } catch (error) {
      console.error('Error uploading files:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      onError?.(`Lỗi upload ảnh: ${errorMessage}`);
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const files = e.target.files;
    if (files) {
      await uploadFiles(files);
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleReorder = (activeId: UniqueIdentifier, overId: UniqueIdentifier): void => {
    setGalleryUrls((prev) => {
      const oldIndex = prev.findIndex((item) => getItemId(item) === activeId);
      const newIndex = prev.findIndex((item) => getItemId(item) === overId);
      if (oldIndex === -1 || newIndex === -1) {
        return prev;
      }

      const heroId = prev[heroImageIndex] ? getItemId(prev[heroImageIndex]) : null;
      const updated = arrayMove(prev, oldIndex, newIndex);

      if (heroId) {
        const nextHeroIndex = updated.findIndex((item) => getItemId(item) === heroId);
        if (nextHeroIndex >= 0 && nextHeroIndex !== heroImageIndex) {
          setHeroImageIndex(nextHeroIndex);
        }
      }

      const galleryUrlStrings = updated.map((item) => typeof item === 'string' ? item : item.url);
      const galleryAssetIds = updated
        .map((item) => (typeof item === 'string' ? null : item.assetId))
        .filter((x): x is string => typeof x === 'string' && x.length > 0);
      onReorder?.({ urls: galleryUrlStrings, assetIds: galleryAssetIds });

      return updated;
    });
  };

  const handleDragOver = (e: React.DragEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent): Promise<void> => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    await uploadFiles(files);
  };

  const handleClick = (): void => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleGalleryUrlRemove = (index: number, onRemove?: (urls: string[]) => void): void => {
    setGalleryUrls((prev) => {
      const removedItem = prev[index];
      const newUrls = prev.filter((_, i) => i !== index);
      
      if (removedItem && typeof removedItem === 'object' && 'originalName' in removedItem) {
        setUploadedFileNames((prevNames) => {
          const newSet = new Set(prevNames);
          newSet.delete(removedItem.originalName);
          return newSet;
        });
      }
      
      if (index === heroImageIndex) {
        setHeroImageIndex(0);
      } else if (index < heroImageIndex) {
        setHeroImageIndex(prev => Math.max(0, prev - 1));
      }
      
      const galleryUrlStrings = newUrls.map(item => typeof item === 'string' ? item : item.url);
      onRemove?.(galleryUrlStrings);
      
      return newUrls;
    });
  };

  const handleSetHeroImage = (index: number): void => {
    setHeroImageIndex(index);
  };

  const reset = (): void => {
    setGalleryUrls([]);
    setUploadedFileNames(new Set());
    setHeroImageIndex(0);
    setUploadProgress({});
  };

  const getGalleryUrlStrings = (): string[] => {
    return galleryUrls.map(item => typeof item === 'string' ? item : item.url);
  };

  const getGalleryAssetIds = (): string[] => {
    return galleryUrls
      .map((item) => (typeof item === 'string' ? null : item.assetId))
      .filter((x): x is string => typeof x === 'string' && x.length > 0);
  };

  const setGalleryUrlsExternal = (urls: string[]): void => {
    // Legacy helper: used when hydrating from URL-only lists.
    // For the assetId-first path, admin pages should call setGalleryUrls with GalleryItem objects instead.
    setGalleryUrls(urls.map(url => ({ url, assetId: url, originalName: url })));
  };

  return {
    galleryUrls,
    heroImageIndex,
    uploading,
    uploadProgress,
    isDragging,
    fileInputRef,
    handleFileUpload,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleClick,
    handleGalleryUrlRemove,
    handleSetHeroImage,
    handleReorder,
    reset,
    getGalleryUrlStrings,
    getGalleryAssetIds,
    setGalleryUrls: setGalleryUrlsExternal,
    setHeroImageIndex,
  };
}

