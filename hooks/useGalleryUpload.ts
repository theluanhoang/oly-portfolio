"use client";

import type { UniqueIdentifier } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useRef, useState } from "react";

interface GalleryItem {
  url: string;
  originalName: string;
}

interface UploadProgressItem {
  status: 'uploading' | 'success' | 'error';
  progress?: number;
  error?: string;
}

interface UseGalleryUploadOptions {
  onUploadSuccess?: (urls: string[]) => void;
  onError?: (error: string) => void;
  onReorder?: (urls: string[]) => void;
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
    
    const imageFiles = fileArray.filter((file: File) => {
      return file.type.startsWith('image/');
    });

    if (imageFiles.length === 0) {
      onError?.('Vui lòng chọn file ảnh (JPEG, PNG, WebP, GIF)');
      return;
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
        const formData = new FormData();
        formData.append('file', file);

        setUploadProgress((prev) => ({
          ...prev,
          [file.name]: { status: 'uploading', progress: 0 },
        }));

        try {
          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          const result = await response.json() as { url: string; error?: string };

          if (!response.ok) {
            throw new Error(result.error || 'Upload failed');
          }

          setUploadProgress((prev) => ({
            ...prev,
            [file.name]: { status: 'success', progress: 100 },
          }));

          return { url: result.url, originalName: file.name };
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

      onUploadSuccess?.(newUrls);
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
      onReorder?.(galleryUrlStrings);

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

  const setGalleryUrlsExternal = (urls: string[]): void => {
    setGalleryUrls(urls.map(url => ({ url, originalName: url })));
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
    setGalleryUrls: setGalleryUrlsExternal,
    setHeroImageIndex,
  };
}

