/**
 * Image Processing Queue
 * Simple in-memory job queue for async image processing
 * Can be extended with Redis/BullMQ for production scale
 */

import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { optimizeImage, getOutputFormat } from '@/lib/imageOptimization';
import sharp from 'sharp';

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ImageProcessingJob {
  id: string;
  status: JobStatus;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  tempFilePath: string;
  originalFilename: string;
  originalFormat?: string;
  outputUrl?: string;
  outputFilename?: string;
  error?: string;
  progress?: number;
}

class ImageProcessingQueue {
  private jobs: Map<string, ImageProcessingJob> = new Map();
  private processing: Set<string> = new Set();
  private maxConcurrentJobs = 3; // Process max 3 images concurrently

  /**
   * Create a new image processing job
   */
  async createJob(
    tempFilePath: string,
    originalFilename: string
  ): Promise<string> {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    const job: ImageProcessingJob = {
      id: jobId,
      status: 'pending',
      createdAt: Date.now(),
      tempFilePath,
      originalFilename,
    };

    this.jobs.set(jobId, job);
    
    // Start processing if not at max capacity
    this.processNext();

    return jobId;
  }

  /**
   * Get job status
   */
  getJob(jobId: string): ImageProcessingJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Process next job in queue
   */
  private async processNext(): Promise<void> {
    // Don't process if at max capacity
    if (this.processing.size >= this.maxConcurrentJobs) {
      return;
    }

    // Find next pending job
    const pendingJob = Array.from(this.jobs.values()).find(
      (job) => job.status === 'pending'
    );

    if (!pendingJob) {
      return;
    }

    // Mark as processing
    pendingJob.status = 'processing';
    pendingJob.startedAt = Date.now();
    this.processing.add(pendingJob.id);

    // Process in background (non-blocking)
    setImmediate(() => {
      this.processJob(pendingJob.id).catch((error) => {
        console.error(`Error processing job ${pendingJob.id}:`, error);
        const job = this.jobs.get(pendingJob.id);
        if (job) {
          job.status = 'failed';
          job.error = error instanceof Error ? error.message : 'Unknown error';
          job.completedAt = Date.now();
        }
        this.processing.delete(pendingJob.id);
        // Try to process next job
        this.processNext();
      });
    });
  }

  /**
   * Process a single job
   */
  private async processJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    try {
      // Read temp file
      const fs = await import('fs/promises');
      const tempBuffer = await fs.readFile(job.tempFilePath);

      // Get original format
      const metadata = await sharp(tempBuffer).metadata();
      const originalFormat = metadata.format || 'jpeg';
      job.originalFormat = originalFormat;

      job.progress = 20;

      // Optimize image
      const optimizedBuffer = await optimizeImage(tempBuffer, {
        maxWidth: 2048,
        maxHeight: 2048,
        quality: 80,
        convertToWebP: true,
      });

      job.progress = 80;

      // Determine output format
      const outputFormat = getOutputFormat(originalFormat, true);

      // Save optimized image
      const uploadsDir = join(process.cwd(), 'public', 'uploads');
      await mkdir(uploadsDir, { recursive: true });

      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const extension = outputFormat === 'jpeg' ? 'jpg' : outputFormat;
      const filename = `${timestamp}-${randomString}.${extension}`;
      const filepath = join(uploadsDir, filename);

      await writeFile(filepath, optimizedBuffer);

      job.progress = 100;

      // Update job with results
      job.status = 'completed';
      job.completedAt = Date.now();
      job.outputUrl = `/uploads/${filename}`;
      job.outputFilename = filename;

      // Clean up temp file
      try {
        await unlink(job.tempFilePath);
      } catch (cleanupError) {
        console.warn(`Failed to delete temp file ${job.tempFilePath}:`, cleanupError);
      }
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      job.completedAt = Date.now();

      // Clean up temp file even on error
      try {
        await unlink(job.tempFilePath);
      } catch (cleanupError) {
        console.warn(`Failed to delete temp file ${job.tempFilePath}:`, cleanupError);
      }

      throw error;
    } finally {
      this.processing.delete(jobId);
      // Process next job
      this.processNext();
    }
  }

  /**
   * Clean up old completed/failed jobs (older than 1 hour)
   */
  cleanupOldJobs(): void {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    
    for (const [jobId, job] of this.jobs.entries()) {
      if (
        (job.status === 'completed' || job.status === 'failed') &&
        job.completedAt &&
        job.completedAt < oneHourAgo
      ) {
        this.jobs.delete(jobId);
      }
    }
  }
}

// Singleton instance
export const imageProcessingQueue = new ImageProcessingQueue();

// Clean up old jobs every 10 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    imageProcessingQueue.cleanupOldJobs();
  }, 10 * 60 * 1000);
}
