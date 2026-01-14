'use client';

import { useRef, useState } from 'react';
import { Image as ImageIcon, Upload, X } from 'lucide-react';
import { Input } from '@/components/forms';
import { Button } from '@/components/ui';
import { compressImage, calculateUploadSpeed, formatFileSize } from '@/lib/image-utils';

interface SingleImageUploadProps {
  value?: string; // preview URL
  onChange: (result: { assetId: string; url: string }) => void;
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
  const [uploadSpeed, setUploadSpeed] = useState<number | null>(null);
  const [originalSize, setOriginalSize] = useState<number | null>(null);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_SIZE_BYTES = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      const sizeMb = file.size / (1024 * 1024);
      alert(
        `Ảnh quá lớn (${sizeMb.toFixed(
          1,
        )}MB). Vui lòng chọn ảnh dưới 10MB để đảm bảo tốc độ tải và ổn định.`,
      );
      onChange({ url: '', assetId: '' });
      return;
    }

    if (!file.type.startsWith('image/')) {
      onChange({ url: '', assetId: '' });
      return;
    }

    await uploadFile(file);
    if (e.target) {
      e.target.value = '';
    }
  };

  const uploadFile = async (file: File) => {
    const uploadStartTime = Date.now();
    setUploading(true);
    setUploadProgress(0);
    setUploadSpeed(null);
    setOriginalSize(file.size);
    setCompressedSize(null);
    setIsCompressing(false);

    try {
      // 0) Compress image trước khi upload (nếu cần)
      let fileToUpload = file;
      const shouldCompress = file.size > 500 * 1024; // > 500KB
      
      if (shouldCompress) {
        setIsCompressing(true);
        try {
          fileToUpload = await compressImage(file, {
            maxWidth: 2048,
            maxHeight: 2048,
            quality: 0.85,
            maxSizeMB: 2,
            outputFormat: 'jpeg',
          });
          setCompressedSize(fileToUpload.size);
        } catch (compressError) {
          console.warn(`Failed to compress ${file.name}, using original:`, compressError);
          // Fallback to original file if compression fails
        } finally {
          setIsCompressing(false);
        }
      }

      // 1) Lấy chữ ký upload từ server
      setUploadProgress(5);
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

      // 2) Upload trực tiếp lên Cloudinary bằng XHR để giữ progress
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

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.min(95, 10 + (e.loaded / e.total) * 85);
          setUploadProgress(percentComplete);
          const speed = calculateUploadSpeed(e.loaded, e.total, uploadStartTime);
          setUploadSpeed(speed);
        }
      });

      const uploadResult = await new Promise<{
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
        xhr.addEventListener('load', () => {
          try {
            const result = JSON.parse(xhr.responseText);
            if (xhr.status === 200) {
              resolve(result);
            } else {
              reject(
                new Error(
                  result?.error?.message || 'Cloudinary upload failed',
                ),
              );
            }
          } catch {
            reject(new Error('Invalid Cloudinary response'));
          }
        });

        xhr.addEventListener('error', () =>
          reject(new Error('Cloudinary upload failed')),
        );
        xhr.open('POST', cloudinaryUrl);
        xhr.send(formData);
      });

      if (!uploadResult.public_id) {
        throw new Error('Cloudinary upload did not return public_id');
      }

      const metaRes = await fetch('/api/media-assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: 'cloudinary',
          publicId: uploadResult.public_id,
          version: uploadResult.version,
          mimeType:
            uploadResult.resource_type === 'image'
              ? uploadResult.format
              : file.type,
          width: uploadResult.width,
          height: uploadResult.height,
          bytes: uploadResult.bytes,
        }),
      });

      const meta = (await metaRes.json()) as {
        success?: boolean;
        assetId?: string;
        url?: string | null;
        error?: string;
      };

      if (!metaRes.ok || !meta.success || !meta.assetId) {
        throw new Error(meta.error || 'Failed to create media asset');
      }

      const finalUrl = meta.url || uploadResult.secure_url;
      if (!finalUrl) {
        throw new Error('No URL returned for uploaded image');
      }

      setUploadProgress(100);
      onChange({ url: finalUrl, assetId: meta.assetId });
    } catch (error) {
      console.error('Error uploading file:', error);
      onChange({ url: '', assetId: '' });
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setUploadSpeed(null);
      setOriginalSize(null);
      setCompressedSize(null);
      setIsCompressing(false);
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
    onChange({ url: '', assetId: '' });
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
              <div className="text-xs text-[#666] mt-1 space-y-1">
                <p>
                  {isCompressing ? 'Đang tối ưu ảnh...' : `Đang upload... ${Math.round(uploadProgress)}%`}
                  {uploadSpeed && !isCompressing && ` (${uploadSpeed} KB/s)`}
                </p>
                {originalSize && compressedSize && compressedSize < originalSize && (
                  <p className="text-[#999]">
                    Đã giảm: {formatFileSize(compressedSize)} / {formatFileSize(originalSize)} 
                    ({Math.round((1 - compressedSize / originalSize) * 100)}%)
                  </p>
                )}
                {originalSize && !compressedSize && (
                  <p className="text-[#999]">Kích thước: {formatFileSize(originalSize)}</p>
                )}
              </div>
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
                Hỗ trợ JPEG, PNG, WebP, GIF • Tối đa 10MB
              </p>
              {uploading && (
                <div className="mt-4 w-full max-w-xs">
                  <div className="w-full bg-[#e0e0e0] h-1.5">
                    <div
                      className="bg-[#333] h-1.5 transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-[#666] mt-1 space-y-1">
                    <p>
                      {isCompressing ? 'Đang tối ưu ảnh...' : `Đang upload... ${Math.round(uploadProgress)}%`}
                      {uploadSpeed && !isCompressing && ` (${uploadSpeed} KB/s)`}
                    </p>
                    {originalSize && compressedSize && compressedSize < originalSize && (
                      <p className="text-[#999]">
                        Đã giảm: {formatFileSize(compressedSize)} / {formatFileSize(originalSize)} 
                        ({Math.round((1 - compressedSize / originalSize) * 100)}%)
                      </p>
                    )}
                    {originalSize && !compressedSize && (
                      <p className="text-[#999]">Kích thước: {formatFileSize(originalSize)}</p>
                    )}
                  </div>
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
