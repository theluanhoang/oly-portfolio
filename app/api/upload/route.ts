import { writeFile, mkdir, access } from 'fs/promises';
import { join } from 'path';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, checkAdminAuth } from '@/lib/auth';
import { optimizeImage, getOutputFormat } from '@/lib/imageOptimization';
import { validateImageUpload } from '@/lib/validations/imageUploadValidation';
import sharp from 'sharp';

/**
 * Sanitize filename for SEO-friendly URLs
 * Converts to lowercase, removes accents, replaces spaces/special chars with hyphens
 */
function sanitizeFilename(filename: string): string {
  // Remove extension
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
  
  // Sanitize similar to generateSlug
  let sanitized = nameWithoutExt
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  
  // Limit length to 100 characters for SEO
  if (sanitized.length > 100) {
    sanitized = sanitized.substring(0, 100);
    sanitized = sanitized.replace(/-+$/, ''); // Remove trailing hyphen if cut off
  }
  
  // If empty after sanitization, use a default name
  if (!sanitized) {
    sanitized = 'image';
  }
  
  return sanitized;
}

/**
 * Generate SEO-friendly filename with collision handling
 */
async function generateSEOFilename(
  originalFilename: string,
  extension: string,
  uploadsDir: string
): Promise<string> {
  const sanitized = sanitizeFilename(originalFilename);
  let filename = `${sanitized}.${extension}`;
  let counter = 1;
  
  // Check if file exists and add counter if needed
  while (true) {
    const filepath = join(uploadsDir, filename);
    try {
      await access(filepath);
      // File exists, try with counter
      filename = `${sanitized}-${counter}.${extension}`;
      counter++;
    } catch {
      // File doesn't exist, we can use this filename
      break;
    }
  }
  
  return filename;
}

export const maxDuration = 300;

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

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (error) {
      console.error('Error parsing FormData:', error);
      return NextResponse.json(
        { error: 'Failed to parse request body. File may be too large or request timed out.' },
        { status: 413 }
      );
    }
    
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
      maxFileSize: 50 * 1024 * 1024,
      maxWidth: 10000,
      maxHeight: 10000,
    });

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || 'File validation failed' },
        { status: 400 }
      );
    }

    let optimizedBuffer: Buffer;
    let outputFormat: string;
    try {
      const metadata = await sharp(originalBuffer).metadata();
      const originalFormat = metadata.format || 'jpeg';
      const width = metadata.width || 0;
      const height = metadata.height || 0;
      const fileSizeMB = originalBuffer.length / (1024 * 1024);
      
      const isAlreadyOptimized = 
        width <= 2048 && 
        height <= 2048 && 
        fileSizeMB < 5 && 
        (originalFormat === 'webp' || originalFormat === 'jpeg' || originalFormat === 'jpg');
      
      if (isAlreadyOptimized) {
        console.log(`✅ Using client-optimized image: ${width}x${height}px, ${fileSizeMB.toFixed(2)}MB, ${originalFormat.toUpperCase()}`);
        optimizedBuffer = originalBuffer;
        outputFormat = originalFormat === 'jpg' ? 'jpeg' : originalFormat;
      } else {
        console.log(`🔄 Server optimizing: ${width}x${height}px, ${fileSizeMB.toFixed(2)}MB, ${originalFormat.toUpperCase()}`);
        optimizedBuffer = await optimizeImage(originalBuffer, {
          maxWidth: 2048,
          maxHeight: 2048,
          quality: 80,
          convertToWebP: true,
        });
        outputFormat = getOutputFormat(originalFormat, true);
        const optimizedSizeMB = optimizedBuffer.length / (1024 * 1024);
        console.log(`✅ Server optimization: ${optimizedSizeMB.toFixed(2)}MB, ${outputFormat.toUpperCase()}`);
      }
    } catch (optimizationError) {
      console.error('Error optimizing image:', optimizationError);
      optimizedBuffer = originalBuffer;
      outputFormat = file.name.split('.').pop() || 'jpg';
    }

    // Check if this is a project image upload
    const projectSlug = formData.get('projectSlug') as string | null;
    
    let uploadsDir: string;
    let publicUrl: string;
    let filename: string;
    
    const extension = outputFormat === 'jpeg' ? 'jpg' : outputFormat;
    
    if (projectSlug && projectSlug.trim()) {
      // Save to project-specific folder: public/uploads/projects/{slug}/
      uploadsDir = join(process.cwd(), 'public', 'uploads', 'projects', projectSlug.trim());
      try {
        await mkdir(uploadsDir, { recursive: true });
      } catch (error) {
        console.warn('Failed to create project uploads directory:', error);
      }
      
      // Generate SEO-friendly filename
      filename = await generateSEOFilename(file.name, extension, uploadsDir);
      const filepath = join(uploadsDir, filename);
      
      await writeFile(filepath, optimizedBuffer);
      
      publicUrl = `/uploads/projects/${projectSlug.trim()}/${filename}`;
    } else {
      // Default behavior: save to public/uploads/
      uploadsDir = join(process.cwd(), 'public', 'uploads');
      try {
        await mkdir(uploadsDir, { recursive: true });
      } catch (error) {
        console.warn('Failed to create uploads directory:', error);
      }
      
      // Generate SEO-friendly filename
      filename = await generateSEOFilename(file.name, extension, uploadsDir);
      const filepath = join(uploadsDir, filename);
      
      await writeFile(filepath, optimizedBuffer);
      
      publicUrl = `/uploads/${filename}`;
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: filename,
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

