'use client';

import { useRef, useState } from 'react';
import { Image as ImageIcon, Upload, X } from 'lucide-react';
import { Input } from '@/components/forms';
import { Button } from '@/components/ui';
import { prepareImageForUpload } from '@/lib/utils/imageUtils';

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
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
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
    setUploadProgress(0);

    try {
      const originalSizeMB = file.size / (1024 * 1024);
      const fileToUpload = originalSizeMB > 0.5 
        ? await prepareImageForUpload(file).catch(() => file) // Fallback to original if compression fails
        : file;

      const formData = new FormData();
      formData.append('file', fileToUpload);

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setUploadProgress(percentComplete);
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
        onChange(response.url);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      onChange('');
    } finally {
      setUploading(false);
      setUploadProgress(0);
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
              alt="Thumbnail"
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
              title="Xóa ảnh"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          {uploading && (
            <div className="mt-2">
              <div className="w-full bg-[#e0e0e0] h-1.5">
                <div
                  className="bg-[#333] h-1.5 transition-all"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-[#666] mt-1">Đang upload... {Math.round(uploadProgress)}%</p>
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
              <p className="text-[#333] font-medium text-base mb-2">Thả ảnh vào đây</p>
            </div>
          ) : (
            <div className="text-center">
              <ImageIcon className="w-20 h-20 mx-auto mb-4 text-[#666]" strokeWidth={1.5} />
              <p className="text-[#333] font-medium text-base mb-2">
                Kéo thả ảnh vào đây hoặc click để chọn
              </p>
              <p className="text-[#666] text-sm">
                Hỗ trợ JPEG, PNG, WebP, GIF • Tối đa 50MB
              </p>
              {uploading && (
                <div className="mt-4 w-full max-w-xs">
                  <div className="w-full bg-[#e0e0e0] h-1.5">
                    <div
                      className="bg-[#333] h-1.5 transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-[#666] mt-1">Đang upload... {Math.round(uploadProgress)}%</p>
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
