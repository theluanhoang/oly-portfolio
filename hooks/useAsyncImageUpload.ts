"use client";

import { useState, useCallback } from 'react';

interface JobStatus {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  outputUrl?: string;
  error?: string;
}

interface UseAsyncImageUploadOptions {
  onSuccess?: (url: string) => void;
  onError?: (error: string) => void;
  onProgress?: (progress: number) => void;
  pollInterval?: number; // Polling interval in ms (default: 500ms)
}

interface UseAsyncImageUploadReturn {
  upload: (file: File) => Promise<void>;
  status: JobStatus | null;
  uploading: boolean;
  error: string | null;
}

/**
 * Hook for async image upload with background processing
 */
export function useAsyncImageUpload({
  onSuccess,
  onError,
  onProgress,
  pollInterval = 500,
}: UseAsyncImageUploadOptions = {}): UseAsyncImageUploadReturn {
  const [status, setStatus] = useState<JobStatus | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pollJobStatus = useCallback(
    async (jobId: string): Promise<void> => {
      try {
        const response = await fetch(`/api/upload/status/${jobId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to get job status');
        }

        const jobStatus: JobStatus = {
          jobId: data.jobId,
          status: data.status,
          progress: data.progress,
          outputUrl: data.outputUrl,
          error: data.error,
        };

        setStatus(jobStatus);
        onProgress?.(data.progress || 0);

        if (data.status === 'completed') {
          setUploading(false);
          if (data.outputUrl) {
            onSuccess?.(data.outputUrl);
          }
          return;
        }

        if (data.status === 'failed') {
          setUploading(false);
          const errorMsg = data.error || 'Image processing failed';
          setError(errorMsg);
          onError?.(errorMsg);
          return;
        }

        // Continue polling if still processing
        if (data.status === 'pending' || data.status === 'processing') {
          setTimeout(() => pollJobStatus(jobId), pollInterval);
        }
      } catch (err) {
        setUploading(false);
        const errorMsg = err instanceof Error ? err.message : 'Failed to check job status';
        setError(errorMsg);
        onError?.(errorMsg);
      }
    },
    [onSuccess, onError, onProgress, pollInterval]
  );

  const upload = useCallback(
    async (file: File): Promise<void> => {
      setUploading(true);
      setError(null);
      setStatus(null);

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload/async', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Upload failed');
        }

        if (data.jobId) {
          // Start polling for job status
          await pollJobStatus(data.jobId);
        } else {
          throw new Error('No job ID returned');
        }
      } catch (err) {
        setUploading(false);
        const errorMsg = err instanceof Error ? err.message : 'Upload failed';
        setError(errorMsg);
        onError?.(errorMsg);
      }
    },
    [pollJobStatus, onError]
  );

  return {
    upload,
    status,
    uploading,
    error,
  };
}
