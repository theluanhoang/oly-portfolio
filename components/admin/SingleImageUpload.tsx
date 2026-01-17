'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, Image as ImageIcon, Upload, X } from 'lucide-react';
import { Input } from '@/components/forms';
import { Button } from '@/components/ui';
import { prepareImageForUpload } from '@/lib/utils/imageUtils';

interface UploadProgress {
  status: 'compressing' | 'uploading' | 'success' | 'error';
  progress?: number;
  error?: string;
  originalSizeMB?: number;
  compressedSizeMB?: number;
}

interface SingleImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  error?: string;
  label?: string;
}

export default function SingleImageUpload({
  value,
  onChange,
  error,
  label,
}: SingleImageUploadProps) {
  const t = useTranslations('Admin.imageUpload');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { validateImageUploadClient } = await import('@/lib/validations/imageUploadValidationClient');
      const validation = validateImageUploadClient(file);
      
      if (!validation.valid) {
        console.error('Validation error:', validation.error);
        if (e.target) {
          e.target.value = '';
        }
        return;
      }
    } catch (error) {
      console.error('Error validating file:', error);
    }

    await uploadFile(file);
    if (e.target) {
      e.target.value = '';
    }
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    const originalSizeMB = file.size / (1024 * 1024);
    let fileToUpload = file;

    try {
      // Compress image if needed (similar to useGalleryUpload)
      if (originalSizeMB > 0.5) {
        try {
          setUploadProgress({
            status: 'compressing',
            progress: 0,
            originalSizeMB: originalSizeMB,
          });

          fileToUpload = await prepareImageForUpload(file);
          const compressedSizeMB = fileToUpload.size / (1024 * 1024);

          setUploadProgress({
            status: 'uploading',
            progress: 0,
            originalSizeMB: originalSizeMB,
            compressedSizeMB: compressedSizeMB,
          });
        } catch (compressionError) {
          console.warn(`Failed to compress ${file.name}, using original:`, compressionError);
          setUploadProgress({
            status: 'uploading',
            progress: 0,
            originalSizeMB: originalSizeMB,
          });
        }
      } else {
        setUploadProgress({
          status: 'uploading',
          progress: 0,
        });
      }

      const formData = new FormData();
      formData.append('file', fileToUpload);

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setUploadProgress((prev) => ({
            ...prev!,
            progress: percentComplete,
          }));
        }
      });

      const response = await new Promise<{ url: string; error?: string }>((resolve, reject) => {
        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            try {
              const result = JSON.parse(xhr.responseText);
              resolve(result);
            } catch {
              reject(new Error('Invalid response'));
            }
          } else {
            try {
              const result = JSON.parse(xhr.responseText);
              reject(new Error(result.error || 'Upload failed'));
            } catch {
              reject(new Error('Upload failed'));
            }
          }
        });

        xhr.addEventListener('error', () => reject(new Error('Upload failed')));
        xhr.open('POST', '/api/upload');
        xhr.send(formData);
      });

      if (response.url) {
        setUploadProgress((prev) => ({
          ...prev!,
          status: 'success',
          progress: 100,
        }));
        onChange(response.url);
        
        // Clear progress after a short delay
        setTimeout(() => {
          setUploadProgress(null);
        }, 2000);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setUploadProgress({
        status: 'error',
        error: errorMessage,
        originalSizeMB: originalSizeMB,
      });
      onChange('');
      
      // Clear error after a delay
      setTimeout(() => {
        setUploadProgress(null);
      }, 5000);
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      await uploadFile(file);
    }
  };

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemove = () => {
    onChange('');
  };

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-[#333] mb-2">
          {label}
        </label>
      )}
      
      <Input
        ref={fileInputRef}
        name="thumbnail-upload"
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        onChange={handleFileUpload}
        disabled={uploading}
        className="hidden"
      />

      {value ? (
        <div className="relative">
          <div className="relative w-full aspect-square max-w-[400px] border border-[#e0e0e0] bg-[#f5f5f5] overflow-hidden">
            <img
              src={value}
              alt={t('thumbnail')}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23e0e0e0" width="400" height="400"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage not found%3C/text%3E%3C/svg%3E';
              }}
            />
            <Button
              type="button"
              onClick={handleRemove}
              variant="danger"
              size="sm"
              className="absolute top-2 right-2 p-1.5! rounded! min-w-0!"
              title={t('removeImage')}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          {uploadProgress && (
            <div className="mt-2 text-xs text-[#666] bg-[#f5f5f5] p-3 border border-[#e0e0e0]">
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium">{t('thumbnail')}</span>
                <span className="ml-2 flex items-center gap-1">
                  {uploadProgress.status === 'compressing' && (
                    <>
                      <Upload className="w-3 h-3 animate-pulse" />
                      <span>{t('compressing')}</span>
                    </>
                  )}
                  {uploadProgress.status === 'uploading' && (
                    <>
                      <Upload className="w-3 h-3 animate-pulse" />
                      <span>{t('uploading')}</span>
                    </>
                  )}
                  {uploadProgress.status === 'success' && (
                    <>
                      <Check className="w-3 h-3 text-green-600" />
                      <span>{t('success')}</span>
                    </>
                  )}
                  {uploadProgress.status === 'error' && (
                    <>
                      <X className="w-3 h-3 text-red-600" />
                      <span>{uploadProgress.error}</span>
                    </>
                  )}
                </span>
              </div>
              {(uploadProgress.status === 'compressing' || uploadProgress.status === 'uploading') && (
                <div className="w-full bg-[#e0e0e0] h-1.5 mt-2">
                  <div
                    className={`h-1.5 transition-all ${
                      uploadProgress.status === 'compressing' ? 'bg-blue-500' : 'bg-[#333]'
                    }`}
                    style={{ width: `${uploadProgress.progress || 0}%` }}
                  ></div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-none transition-all cursor-pointer
            ${isDragging 
              ? 'border-[#333] bg-[#f5f5f5] scale-[1.02]' 
              : 'border-[#e0e0e0] hover:border-[#333] hover:bg-[#fafafa]'
            }
            ${uploading ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
            min-h-[200px] flex flex-col items-center justify-center p-8
          `}
        >
          {isDragging ? (
            <div className="text-center">
              <Upload className="w-16 h-16 mx-auto mb-4 text-[#333]" strokeWidth={1.5} />
              <p className="text-[#333] font-medium text-base mb-2">{t('dropImageHere')}</p>
            </div>
          ) : (
            <div className="text-center">
              <ImageIcon className="w-20 h-20 mx-auto mb-4 text-[#666]" strokeWidth={1.5} />
              <p className="text-[#333] font-medium text-base mb-2">
                {t('dragDropOrClick')}
              </p>
              <p className="text-[#666] text-sm">
                {t('supportedFormats')}
              </p>
              {uploadProgress && (
                <div className="mt-4 w-full max-w-xs text-xs text-[#666] bg-[#f5f5f5] p-3 border border-[#e0e0e0]">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">{t('thumbnail')}</span>
                    <span className="ml-2 flex items-center gap-1">
                      {uploadProgress.status === 'compressing' && (
                        <>
                          <Upload className="w-3 h-3 animate-pulse" />
                          <span>{t('compressing')}</span>
                        </>
                      )}
                      {uploadProgress.status === 'uploading' && (
                        <>
                          <Upload className="w-3 h-3 animate-pulse" />
                          <span>{t('uploading')}</span>
                        </>
                      )}
                      {uploadProgress.status === 'success' && (
                        <>
                          <Check className="w-3 h-3 text-green-600" />
                          <span>{t('success')}</span>
                        </>
                      )}
                      {uploadProgress.status === 'error' && (
                        <>
                          <X className="w-3 h-3 text-red-600" />
                          <span>{uploadProgress.error}</span>
                        </>
                      )}
                    </span>
                  </div>
                  {(uploadProgress.status === 'compressing' || uploadProgress.status === 'uploading') && (
                    <div className="w-full bg-[#e0e0e0] h-1.5 mt-2">
                      <div
                        className={`h-1.5 transition-all ${
                          uploadProgress.status === 'compressing' ? 'bg-blue-500' : 'bg-[#333]'
                        }`}
                        style={{ width: `${uploadProgress.progress || 0}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="mt-2 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
