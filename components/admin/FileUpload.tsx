'use client';

import { useRef, useState, useEffect } from 'react';
import { Check, FileText, Upload, X } from 'lucide-react';
import { Input } from '@/components/forms';
import { Button } from '@/components/ui';

interface UploadProgress {
  status: 'uploading' | 'success' | 'error';
  progress?: number;
  error?: string;
}

interface FileUploadProps {
  value?: string;
  onChange: (url: string) => void;
  error?: string;
  label?: string;
  accept?: string;
  targetName?: string;
}

export default function FileUpload({
  value,
  onChange,
  error,
  label,
  accept = 'application/pdf',
  targetName,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lastFileUrl, setLastFileUrl] = useState(value || '');

  useEffect(() => {
    if (value) {
      setLastFileUrl(value);
    }
  }, [value]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
    if (e.target) {
      e.target.value = '';
    }
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setUploadProgress({ status: 'uploading', progress: 0 });

    try {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setUploadProgress({
            status: 'uploading',
            progress: percentComplete,
          });
        }
      });

      const response = await new Promise<{ url: string; error?: string }>((resolve, reject) => {
        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            try {
              const result = JSON.parse(xhr.responseText);
              resolve(result);
            } catch {
              reject(new Error('Phản hồi không hợp lệ'));
            }
          } else {
            try {
              const result = JSON.parse(xhr.responseText);
              reject(new Error(result.error || 'Tải lên thất bại'));
            } catch {
              reject(new Error('Tải lên thất bại'));
            }
          }
        });

        xhr.addEventListener('error', () => reject(new Error('Tải lên thất bại')));
        const uploadUrl = targetName
          ? `/api/upload?filename=${encodeURIComponent(targetName)}&overwrite=true`
          : `/api/upload?filename=${encodeURIComponent(file.name)}&oldUrl=${encodeURIComponent(lastFileUrl || '')}`;
        xhr.open('POST', uploadUrl);
        xhr.send(file);
      });

      if (response.url) {
        setUploadProgress({
          status: 'success',
          progress: 100,
        });
        onChange(response.url);
        setLastFileUrl(response.url);
        
        setTimeout(() => {
          setUploadProgress(null);
        }, 2000);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
      setUploadProgress({
        status: 'error',
        error: errorMessage,
      });
      onChange('');
      
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

  // Extract filename from URL
  const getFilenameFromUrl = (url: string) => {
    if (!url) return '';
    const parts = url.split('/');
    return decodeURIComponent(parts[parts.length - 1]);
  };

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-[#333] mb-2 font-bold font-montserrat text-black text-base tracking-[0.16px]">
          {label}
        </label>
      )}
      
      <Input
        ref={fileInputRef}
        name="document-upload"
        type="file"
        accept={accept}
        onChange={handleFileUpload}
        disabled={uploading}
        className="hidden"
      />

      {value ? (
        <div className="relative">
          <div className="flex items-center gap-3 p-4 border border-[#e0e0e0] bg-[#fafafa] rounded-none">
            <div className="p-2 bg-white border border-[#e0e0e0]">
              <FileText className="w-8 h-8 text-[#333]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#333] truncate">
                {getFilenameFromUrl(value)}
              </p>
              <a 
                href={value} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-xs text-gray-500 hover:text-black underline truncate block"
              >
                Xem tài liệu đã tải lên
              </a>
            </div>
            <Button
              type="button"
              onClick={handleRemove}
              variant="danger"
              size="sm"
              className="p-1.5! rounded! min-w-0!"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          {uploadProgress && (
            <div className="mt-2 text-xs text-[#666] bg-[#f5f5f5] p-3 border border-[#e0e0e0]">
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium">Tiến trình</span>
                <span className="ml-2 flex items-center gap-1">
                  {uploadProgress.status === 'uploading' && (
                    <>
                      <Upload className="w-3 h-3 animate-pulse" />
                      <span>Đang tải lên...</span>
                    </>
                  )}
                  {uploadProgress.status === 'success' && (
                    <>
                      <Check className="w-3 h-3 text-green-600" />
                      <span>Thành công</span>
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
              {uploadProgress.status === 'uploading' && (
                <div className="w-full bg-[#e0e0e0] h-1.5 mt-2">
                  <div
                    className="h-1.5 bg-[#333] transition-all"
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
            min-h-[150px] flex flex-col items-center justify-center p-6
          `}
        >
          <div className="text-center">
            <Upload className="w-12 h-12 mx-auto mb-3 text-[#666]" strokeWidth={1.5} />
            <p className="text-[#333] font-medium text-sm mb-1">
              Kéo thả tài liệu PDF vào đây hoặc click để chọn
            </p>
            <p className="text-[#666] text-xs">
              Hỗ trợ định dạng PDF • Tối đa 50MB
            </p>
            {uploadProgress && (
              <div className="mt-4 w-full max-w-xs text-xs text-[#666] bg-[#f5f5f5] p-3 border border-[#e0e0e0] mx-auto text-left">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium">Tiến trình</span>
                  <span className="ml-2 flex items-center gap-1">
                    {uploadProgress.status === 'uploading' && (
                      <>
                        <Upload className="w-3 h-3 animate-pulse" />
                        <span>Đang tải lên...</span>
                      </>
                    )}
                    {uploadProgress.status === 'success' && (
                      <>
                        <Check className="w-3 h-3 text-green-600" />
                        <span>Thành công</span>
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
                {uploadProgress.status === 'uploading' && (
                  <div className="w-full bg-[#e0e0e0] h-1.5 mt-2">
                    <div
                      className="h-1.5 bg-[#333] transition-all"
                      style={{ width: `${uploadProgress.progress || 0}%` }}
                    ></div>
                  </div>
                )}
              </div>
            )}
          </div>
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
