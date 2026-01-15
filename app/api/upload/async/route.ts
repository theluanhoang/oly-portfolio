import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, checkAdminAuth } from '@/lib/auth';
import { validateImageUpload } from '@/lib/validations/imageUploadValidation';
import { imageProcessingQueue } from '@/lib/workers/imageProcessingQueue';

/**
 * Async Upload Endpoint
 * Accepts file, saves to temp location, creates processing job, returns job ID immediately
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    const adminCheck = await checkAdminAuth(session);
    if (adminCheck) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: adminCheck.status }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const originalBuffer = Buffer.from(bytes);

    const validation = await validateImageUpload(file, originalBuffer, {
      maxFileSize: 50 * 1024 * 1024, // 50MB
      maxWidth: 10000,
      maxHeight: 10000,
    });

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || 'File validation failed' },
        { status: 400 }
      );
    }

    const tempDir = join(process.cwd(), 'public', 'uploads', 'temp');
    await mkdir(tempDir, { recursive: true });

    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop() || 'jpg';
    const tempFilename = `temp_${timestamp}_${randomString}.${extension}`;
    const tempFilePath = join(tempDir, tempFilename);

    await writeFile(tempFilePath, originalBuffer);

    const jobId = await imageProcessingQueue.createJob(tempFilePath, file.name);

    return NextResponse.json({
      success: true,
      jobId,
      message: 'File uploaded. Processing in background.',
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to upload file', details: errorMessage },
      { status: 500 }
    );
  }
}
