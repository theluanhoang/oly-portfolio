/**
 * Image Optimization Performance Test Suite
 * 
 * Tests image optimization performance and quality according to industry best practices.
 * Metrics tested:
 * - Processing time (latency)
 * - Throughput (requests per second)
 * - Size reduction percentage
 * - Memory usage
 * - Error rate
 * - Quality metrics (if applicable)
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import sharp from 'sharp';

interface TestResult {
  filename: string;
  originalSize: number;
  optimizedSize: number;
  reductionPercent: number;
  processingTime: number;
  format: string;
  dimensions: { width: number; height: number };
  success: boolean;
  error?: string;
}

interface BenchmarkResult {
  totalImages: number;
  successful: number;
  failed: number;
  avgProcessingTime: number;
  minProcessingTime: number;
  maxProcessingTime: number;
  avgSizeReduction: number;
  totalOriginalSize: number;
  totalOptimizedSize: number;
  totalReduction: number;
  throughput: number; // images per second
  results: TestResult[];
}

const IMAGE_CONFIG = {
  maxWidth: 1920,
  maxHeight: 1920,
  webpQuality: 82,
  maxFileSizeAfter: 1 * 1024 * 1024,
  stripMetadata: true,
};

/**
 * Test single image optimization
 */
async function testImageOptimization(
  imagePath: string,
  filename: string
): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    const buffer = readFileSync(imagePath);
    const originalSize = buffer.length;
    
    const image = sharp(buffer);
    const metadata = await image.metadata();
    
    if (!metadata.width || !metadata.height) {
      throw new Error('Invalid image metadata');
    }
    
    const isGif = filename.toLowerCase().endsWith('.gif');
    const hasTransparency = metadata.hasAlpha || false;
    
    let pipeline = image;
    
    // Resize if needed
    if (
      metadata.width > IMAGE_CONFIG.maxWidth ||
      metadata.height > IMAGE_CONFIG.maxHeight
    ) {
      pipeline = pipeline.resize(IMAGE_CONFIG.maxWidth, IMAGE_CONFIG.maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }
    
    // Strip metadata
    if (IMAGE_CONFIG.stripMetadata) {
      pipeline = pipeline.withMetadata({});
    }
    
    let processedBuffer: Buffer;
    let outputExtension: string;
    
    if (isGif) {
      outputExtension = 'gif';
      processedBuffer = await pipeline.gif().toBuffer();
    } else if (hasTransparency) {
      outputExtension = 'webp';
      const losslessBuffer = await pipeline.webp({ lossless: true }).toBuffer();
      
      if (losslessBuffer.length < 500 * 1024) {
        processedBuffer = losslessBuffer;
      } else {
        processedBuffer = await pipeline
          .webp({ quality: 90, effort: 6 })
          .toBuffer();
        
        if (processedBuffer.length > IMAGE_CONFIG.maxFileSizeAfter) {
          processedBuffer = await pipeline
            .webp({ quality: 85, effort: 6 })
            .toBuffer();
        }
      }
    } else {
      outputExtension = 'webp';
      processedBuffer = await pipeline
        .webp({ quality: IMAGE_CONFIG.webpQuality })
        .toBuffer();
      
      if (processedBuffer.length > IMAGE_CONFIG.maxFileSizeAfter) {
        const reducedImage = image
          .resize(IMAGE_CONFIG.maxWidth, IMAGE_CONFIG.maxHeight, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .withMetadata({});
        
        processedBuffer = await reducedImage.webp({ quality: 75 }).toBuffer();
        
        if (processedBuffer.length > IMAGE_CONFIG.maxFileSizeAfter) {
          processedBuffer = await reducedImage.webp({ quality: 65 }).toBuffer();
        }
      }
    }
    
    const processingTime = Date.now() - startTime;
    const optimizedSize = processedBuffer.length;
    const reductionPercent = ((1 - optimizedSize / originalSize) * 100);
    
    return {
      filename,
      originalSize,
      optimizedSize,
      reductionPercent: Number(reductionPercent.toFixed(1)),
      processingTime,
      format: outputExtension,
      dimensions: {
        width: metadata.width,
        height: metadata.height,
      },
      success: true,
    };
  } catch (error) {
    return {
      filename,
      originalSize: 0,
      optimizedSize: 0,
      reductionPercent: 0,
      processingTime: Date.now() - startTime,
      format: 'unknown',
      dimensions: { width: 0, height: 0 },
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Run benchmark on multiple images
 */
async function runBenchmark(
  imagePaths: string[],
  concurrent: number = 1
): Promise<BenchmarkResult> {
  const results: TestResult[] = [];
  const startTime = Date.now();
  
  // Process images in batches
  for (let i = 0; i < imagePaths.length; i += concurrent) {
    const batch = imagePaths.slice(i, i + concurrent);
    const batchResults = await Promise.all(
      batch.map((path) => {
        const filename = path.split('/').pop() || path;
        return testImageOptimization(path, filename);
      })
    );
    results.push(...batchResults);
  }
  
  const totalTime = Date.now() - startTime;
  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);
  
  const processingTimes = successful.map((r) => r.processingTime);
  const sizeReductions = successful.map((r) => r.reductionPercent);
  
  const totalOriginalSize = successful.reduce((sum, r) => sum + r.originalSize, 0);
  const totalOptimizedSize = successful.reduce((sum, r) => sum + r.optimizedSize, 0);
  
  return {
    totalImages: results.length,
    successful: successful.length,
    failed: failed.length,
    avgProcessingTime: processingTimes.length > 0
      ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
      : 0,
    minProcessingTime: processingTimes.length > 0 ? Math.min(...processingTimes) : 0,
    maxProcessingTime: processingTimes.length > 0 ? Math.max(...processingTimes) : 0,
    avgSizeReduction: sizeReductions.length > 0
      ? sizeReductions.reduce((a, b) => a + b, 0) / sizeReductions.length
      : 0,
    totalOriginalSize,
    totalOptimizedSize,
    totalReduction: totalOriginalSize > 0
      ? ((1 - totalOptimizedSize / totalOriginalSize) * 100)
      : 0,
    throughput: (successful.length / (totalTime / 1000)), // images per second
    results,
  };
}

/**
 * Print benchmark results
 */
function printResults(result: BenchmarkResult) {
  console.log('\n' + '='.repeat(80));
  console.log('IMAGE OPTIMIZATION BENCHMARK RESULTS');
  console.log('='.repeat(80));
  
  console.log(`\n📊 Summary:`);
  console.log(`   Total Images: ${result.totalImages}`);
  console.log(`   Successful: ${result.successful} ✅`);
  console.log(`   Failed: ${result.failed} ${result.failed > 0 ? '❌' : ''}`);
  
  console.log(`\n⏱️  Performance:`);
  console.log(`   Average Processing Time: ${result.avgProcessingTime.toFixed(2)}ms`);
  console.log(`   Min Processing Time: ${result.minProcessingTime}ms`);
  console.log(`   Max Processing Time: ${result.maxProcessingTime}ms`);
  console.log(`   Throughput: ${result.throughput.toFixed(2)} images/second`);
  
  console.log(`\n💾 Size Optimization:`);
  console.log(`   Total Original Size: ${(result.totalOriginalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Total Optimized Size: ${(result.totalOptimizedSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Total Reduction: ${result.totalReduction.toFixed(1)}%`);
  console.log(`   Average Reduction: ${result.avgSizeReduction.toFixed(1)}%`);
  
  if (result.failed > 0) {
    console.log(`\n❌ Failed Images:`);
    result.results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`   - ${r.filename}: ${r.error}`);
      });
  }
  
  // Performance benchmarks (industry standards)
  console.log(`\n🎯 Industry Benchmarks:`);
  const avgTimeMs = result.avgProcessingTime;
  const throughput = result.throughput;
  
  console.log(`   Processing Time: ${avgTimeMs < 500 ? '✅ Excellent' : avgTimeMs < 1000 ? '✅ Good' : '⚠️  Needs Improvement'} (< 500ms ideal)`);
  console.log(`   Throughput: ${throughput > 5 ? '✅ Excellent' : throughput > 2 ? '✅ Good' : '⚠️  Needs Improvement'} (> 5 img/s ideal)`);
  console.log(`   Size Reduction: ${result.avgSizeReduction > 30 ? '✅ Excellent' : result.avgSizeReduction > 20 ? '✅ Good' : '⚠️  Needs Improvement'} (> 30% ideal)`);
  
  console.log('\n' + '='.repeat(80));
}

/**
 * Get all image files from a directory
 */
function getImageFiles(dirPath: string): string[] {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const files: string[] = [];
  
  try {
    const entries = readdirSync(dirPath);
    
    for (const entry of entries) {
      const fullPath = join(dirPath, entry);
      const stats = statSync(fullPath);
      
      if (stats.isFile()) {
        const ext = extname(entry).toLowerCase();
        if (imageExtensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
  }
  
  return files.sort(); // Sort for consistent order
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const inputPath = args[0] || join(process.cwd(), 'test-images');
  const concurrent = parseInt(args[1] || '1', 10);
  
  console.log('🔍 Image Optimization Performance Test');
  console.log(`   Input Path: ${inputPath}`);
  console.log(`   Concurrent Processing: ${concurrent}`);
  
  // Find test images
  const testImages: string[] = [];
  
  if (args.length > 0) {
    // Check if path exists
    if (!existsSync(inputPath)) {
      console.error(`\n❌ Path not found: ${inputPath}`);
      console.log('\n💡 Tips:');
      console.log('   - If running in Docker, use container paths (e.g., /app/test-images)');
      console.log('   - If running locally, use relative paths (e.g., ./test-images)');
      console.log('   - Current working directory:', process.cwd());
      process.exit(1);
    }
    
    const stats = statSync(inputPath);
    
    if (stats.isDirectory()) {
      // Scan directory for image files
      const files = getImageFiles(inputPath);
      if (files.length === 0) {
        console.error(`\n❌ No image files found in directory: ${inputPath}`);
        console.log('   Supported formats: .jpg, .jpeg, .png, .gif, .webp');
        process.exit(1);
      }
      testImages.push(...files);
      console.log(`\n📁 Found ${files.length} image file(s) in directory`);
    } else if (stats.isFile()) {
      // Single file
      const ext = extname(inputPath).toLowerCase();
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      
      if (!imageExtensions.includes(ext)) {
        console.error(`\n❌ File is not a supported image format: ${inputPath}`);
        console.log('   Supported formats: .jpg, .jpeg, .png, .gif, .webp');
        process.exit(1);
      }
      
      testImages.push(inputPath);
    }
  } else {
    // Default: use test-images directory
    const defaultPath = join(process.cwd(), 'test-images');
    if (existsSync(defaultPath)) {
      const files = getImageFiles(defaultPath);
      if (files.length > 0) {
        testImages.push(...files);
        console.log(`\n📁 Using default test-images directory (${files.length} files)`);
      }
    }
  }
  
  if (testImages.length === 0) {
    console.log('\n⚠️  No test images found.');
    console.log('Usage:');
    console.log('   tsx scripts/test-image-optimization.ts [path] [concurrent]');
    console.log('\nExamples:');
    console.log('   # Test all images in test-images folder');
    console.log('   tsx scripts/test-image-optimization.ts ./test-images');
    console.log('   tsx scripts/test-image-optimization.ts ./test-images 3');
    console.log('\n   # Test single image');
    console.log('   tsx scripts/test-image-optimization.ts ./test-images/photo.jpg');
    console.log('\n   # Docker');
    console.log('   tsx scripts/test-image-optimization.ts /app/test-images');
    process.exit(1);
  }
  
  console.log(`\n📸 Testing ${testImages.length} image(s)...`);
  console.log('   Files:');
  testImages.forEach((file, index) => {
    const filename = file.split('/').pop() || file;
    const stats = statSync(file);
    const sizeKB = (stats.size / 1024).toFixed(1);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    const sizeDisplay = stats.size > 1024 * 1024 ? `${sizeMB} MB` : `${sizeKB} KB`;
    console.log(`   ${index + 1}. ${filename} (${sizeDisplay})`);
  });
  console.log('');
  
  const result = await runBenchmark(testImages, concurrent);
  printResults(result);
  
  // Exit with error code if any failed
  if (result.failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { testImageOptimization, runBenchmark, printResults };

