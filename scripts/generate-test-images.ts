/**
 * Generate Test Images Script
 * 
 * Tạo các file ảnh test với nhiều kích thước và format khác nhau
 * để test image optimization performance.
 */

import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import sharp from 'sharp';

interface TestImageConfig {
  name: string;
  width: number;
  height: number;
  format: 'jpeg' | 'png' | 'webp' | 'gif';
  quality?: number;
  hasTransparency?: boolean;
  targetSize?: number; // Target size in KB (approximate)
}

const TEST_IMAGES: TestImageConfig[] = [
  // Small images (< 50KB - should skip optimization)
  {
    name: 'test-small-10kb.jpg',
    width: 200,
    height: 200,
    format: 'jpeg',
    quality: 85,
    targetSize: 10,
  },
  {
    name: 'test-small-30kb.jpg',
    width: 400,
    height: 400,
    format: 'jpeg',
    quality: 85,
    targetSize: 30,
  },
  {
    name: 'test-small-45kb.png',
    width: 500,
    height: 500,
    format: 'png',
    hasTransparency: false,
    targetSize: 45,
  },

  // Medium images (50KB - 500KB)
  {
    name: 'test-medium-100kb.jpg',
    width: 1200,
    height: 800,
    format: 'jpeg',
    quality: 85,
    targetSize: 100,
  },
  {
    name: 'test-medium-200kb.jpg',
    width: 1920,
    height: 1080,
    format: 'jpeg',
    quality: 90,
    targetSize: 200,
  },
  {
    name: 'test-medium-300kb.png',
    width: 1600,
    height: 1200,
    format: 'png',
    hasTransparency: true,
    targetSize: 300,
  },

  // Large images (500KB - 2MB)
  {
    name: 'test-large-1mb.jpg',
    width: 3000,
    height: 2000,
    format: 'jpeg',
    quality: 92,
    targetSize: 1000,
  },
  {
    name: 'test-large-1.5mb.jpg',
    width: 4000,
    height: 3000,
    format: 'jpeg',
    quality: 90,
    targetSize: 1500,
  },
  {
    name: 'test-large-2mb.png',
    width: 3500,
    height: 2500,
    format: 'png',
    hasTransparency: false,
    targetSize: 2000,
  },

  // Very large images (2MB - 10MB)
  {
    name: 'test-xlarge-3mb.jpg',
    width: 5000,
    height: 3500,
    format: 'jpeg',
    quality: 95,
    targetSize: 3000,
  },
  {
    name: 'test-xlarge-5mb.jpg',
    width: 6000,
    height: 4000,
    format: 'jpeg',
    quality: 95,
    targetSize: 5000,
  },
  {
    name: 'test-xlarge-8mb.jpg',
    width: 8000,
    height: 6000,
    format: 'jpeg',
    quality: 95,
    targetSize: 8000,
  },

  // Extra large images (> 10MB)
  {
    name: 'test-xxlarge-12mb.jpg',
    width: 10000,
    height: 7000,
    format: 'jpeg',
    quality: 98,
    targetSize: 12000,
  },
  {
    name: 'test-xxlarge-15mb.jpg',
    width: 12000,
    height: 8000,
    format: 'jpeg',
    quality: 98,
    targetSize: 15000,
  },
  {
    name: 'test-xxlarge-20mb.jpg',
    width: 15000,
    height: 10000,
    format: 'jpeg',
    quality: 98,
    targetSize: 20000,
  },
  {
    name: 'test-xxlarge-25mb.jpg',
    width: 18000,
    height: 12000,
    format: 'jpeg',
    quality: 98,
    targetSize: 25000,
  },

  // PNG with transparency
  {
    name: 'test-png-transparency-500kb.png',
    width: 2000,
    height: 2000,
    format: 'png',
    hasTransparency: true,
    targetSize: 500,
  },
  {
    name: 'test-png-transparency-1mb.png',
    width: 3000,
    height: 3000,
    format: 'png',
    hasTransparency: true,
    targetSize: 1000,
  },

  // WebP test
  {
    name: 'test-webp-500kb.webp',
    width: 2000,
    height: 1500,
    format: 'webp',
    quality: 85,
    targetSize: 500,
  },
];

/**
 * Generate a test image with gradient pattern
 */
async function generateTestImage(config: TestImageConfig): Promise<Buffer> {
  const { width, height, format, quality, hasTransparency } = config;

  // Create a gradient image with some patterns for complexity
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:rgb(255,0,0);stop-opacity:1" />
          <stop offset="50%" style="stop-color:rgb(0,255,0);stop-opacity:1" />
          <stop offset="100%" style="stop-color:rgb(0,0,255);stop-opacity:1" />
        </linearGradient>
        <pattern id="pattern1" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
          <circle cx="50" cy="50" r="40" fill="rgba(255,255,255,0.3)"/>
        </pattern>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#grad1)" />
      <rect width="${width}" height="${height}" fill="url(#pattern1)" />
      ${hasTransparency ? `<circle cx="${width / 2}" cy="${height / 2}" r="${Math.min(width, height) / 4}" fill="rgba(255,255,255,0.5)"/>` : ''}
      <text x="${width / 2}" y="${height / 2}" font-size="${Math.min(width, height) / 10}" text-anchor="middle" fill="white" font-family="Arial">
        ${width}x${height}
      </text>
    </svg>
  `;

  let image = sharp(Buffer.from(svg));

  // Convert to target format
  switch (format) {
    case 'jpeg':
      image = image.jpeg({ quality: quality || 85, progressive: true });
      break;
    case 'png':
      image = image.png({
        compressionLevel: 9,
        adaptiveFiltering: true,
        ...(hasTransparency ? {} : { palette: false }),
      });
      break;
    case 'webp':
      image = image.webp({ quality: quality || 85 });
      break;
    case 'gif':
      image = image.gif();
      break;
  }

  return await image.toBuffer();
}

/**
 * Generate test image with target size (approximate)
 */
async function generateImageWithTargetSize(
  config: TestImageConfig
): Promise<Buffer> {
  let buffer = await generateTestImage(config);
  const targetSizeBytes = (config.targetSize || 0) * 1024;

  // If target size is specified, adjust quality to approximate it
  if (targetSizeBytes > 0 && config.format !== 'gif') {
    const currentSize = buffer.length;
    const ratio = targetSizeBytes / currentSize;

    // Adjust quality based on size ratio
    if (ratio < 0.5 || ratio > 2) {
      // Need significant adjustment
      let newQuality = config.quality || 85;

      if (ratio < 0.5) {
        // Need smaller file - reduce quality
        newQuality = Math.max(50, Math.floor((config.quality || 85) * ratio));
      } else if (ratio > 2) {
        // Need larger file - increase quality
        newQuality = Math.min(100, Math.floor((config.quality || 85) * Math.min(ratio, 1.2)));
      }

      // Regenerate with adjusted quality
      const adjustedConfig = { ...config, quality: newQuality };
      buffer = await generateTestImage(adjustedConfig);
    }
  }

  return buffer;
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const outputDir = args[0] || join(process.cwd(), 'test-images');
  const selectedImages = args.slice(1); // Filter specific images if provided

  console.log('🎨 Generating Test Images');
  console.log(`   Output Directory: ${outputDir}`);
  console.log(`   Total Images: ${TEST_IMAGES.length}`);

  // Create output directory
  try {
    await mkdir(outputDir, { recursive: true });
    console.log(`   ✅ Directory created/verified\n`);
  } catch (error) {
    console.error(`   ❌ Failed to create directory: ${error}`);
    process.exit(1);
  }

  // Filter images if specific ones requested
  const imagesToGenerate = selectedImages.length > 0
    ? TEST_IMAGES.filter((img) => selectedImages.includes(img.name))
    : TEST_IMAGES;

  if (imagesToGenerate.length === 0) {
    console.log('⚠️  No images to generate (filtered out all)');
    process.exit(1);
  }

  console.log(`📸 Generating ${imagesToGenerate.length} image(s)...\n`);

  const results: Array<{ name: string; size: number; success: boolean; error?: string }> = [];

  for (let i = 0; i < imagesToGenerate.length; i++) {
    const config = imagesToGenerate[i];
    const filepath = join(outputDir, config.name);

    try {
      process.stdout.write(`   [${i + 1}/${imagesToGenerate.length}] ${config.name}... `);

      const buffer = await generateImageWithTargetSize(config);
      await writeFile(filepath, buffer);

      const sizeKB = (buffer.length / 1024).toFixed(1);
      const sizeMB = (buffer.length / 1024 / 1024).toFixed(2);
      const sizeDisplay = buffer.length > 1024 * 1024 ? `${sizeMB} MB` : `${sizeKB} KB`;

      console.log(`✅ ${sizeDisplay}`);
      results.push({
        name: config.name,
        size: buffer.length,
        success: true,
      });
    } catch (error) {
      console.log(`❌ Failed`);
      results.push({
        name: config.name,
        size: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('GENERATION SUMMARY');
  console.log('='.repeat(80));

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log(`\n📊 Results:`);
  console.log(`   Successful: ${successful.length} ✅`);
  console.log(`   Failed: ${failed.length} ${failed.length > 0 ? '❌' : ''}`);

  if (successful.length > 0) {
    const totalSize = successful.reduce((sum, r) => sum + r.size, 0);
    console.log(`\n💾 Total Size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`\n📁 Files saved to: ${outputDir}`);
  }

  if (failed.length > 0) {
    console.log(`\n❌ Failed Images:`);
    failed.forEach((r) => {
      console.log(`   - ${r.name}: ${r.error}`);
    });
  }

  console.log('\n' + '='.repeat(80));

  // Exit with error code if any failed
  if (failed.length > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { generateTestImage, generateImageWithTargetSize, TEST_IMAGES };

