/**
 * Image Optimization Test Suite
 *
 * Chạy với:
 * - npm run test:image
 * - hoặc: tsx __tests__/lib/image-optimization.test.ts
 */

import sharp from 'sharp';
import { optimizeImage, getOutputFormat } from '../../lib/imageOptimization';

interface TestResult {
  name: string;
  passed: boolean;
  message?: string;
}

const results: TestResult[] = [];

function logResult(name: string, passed: boolean, message?: string) {
  results.push({ name, passed, message });
  if (passed) {
    console.log(`✅ PASS: ${name}${message ? ' - ' + message : ''}`);
  } else {
    console.error(`❌ FAIL: ${name}${message ? ' - ' + message : ''}`);
  }
}

async function assert(condition: boolean, name: string, message?: string) {
  logResult(name, condition, message);
  if (!condition) throw new Error(message || name);
}

async function runImageOptimizationTests() {
  console.log('🖼️  Bắt đầu Image Optimization Tests\n');
  console.log('='.repeat(80));

  // ------------------------------------------------------------
  // 1) Resize/max dimension + JPEG compression
  // ------------------------------------------------------------
  {
    const input = await sharp({
      create: {
        width: 4000,
        height: 3000,
        channels: 3,
        background: { r: 200, g: 100, b: 50 },
      },
    })
      // embed some metadata intentionally; output should strip by default
      .withMetadata({ density: 300 })
      .jpeg({ quality: 95 })
      .toBuffer();

    const output = await optimizeImage(input, { maxWidth: 1920, maxHeight: 1920, quality: 80 });

    const inMeta = await sharp(input).metadata();
    const outMeta = await sharp(output).metadata();

    await assert(!!inMeta.width && !!inMeta.height, 'JPEG input has dimensions');
    await assert(!!outMeta.width && !!outMeta.height, 'JPEG output has dimensions');

    await assert(
      (outMeta.width ?? 0) <= 1920 && (outMeta.height ?? 0) <= 1920,
      'JPEG resized within max dimensions',
      `Got ${outMeta.width}x${outMeta.height}`
    );

    await assert(
      output.length < input.length,
      'JPEG output is smaller than input',
      `input=${input.length} bytes, output=${output.length} bytes`
    );

    await assert(outMeta.format === 'jpeg', 'JPEG output keeps format');
  }

  // ------------------------------------------------------------
  // 2) PNG compression keeps format and usually reduces size
  // ------------------------------------------------------------
  {
    const input = await sharp({
      create: {
        width: 1500,
        height: 1500,
        channels: 4,
        background: { r: 10, g: 20, b: 30, alpha: 1 },
      },
    })
      .png({ compressionLevel: 0 }) // intentionally bad compression to allow improvement
      .toBuffer();

    const output = await optimizeImage(input, { maxWidth: 1920, maxHeight: 1920, quality: 80 });
    const outMeta = await sharp(output).metadata();

    await assert(outMeta.format === 'png', 'PNG output keeps format');
    await assert(
      output.length < input.length,
      'PNG output is smaller than input (after compression)',
      `input=${input.length} bytes, output=${output.length} bytes`
    );
  }

  // ------------------------------------------------------------
  // 3) PNG → WebP conversion (better compression)
  // ------------------------------------------------------------
  {
    const input = await sharp({
      create: {
        width: 2000,
        height: 2000,
        channels: 4,
        background: { r: 100, g: 150, b: 200, alpha: 1 },
      },
    })
      .png({ compressionLevel: 9 })
      .toBuffer();

    const output = await optimizeImage(input, {
      maxWidth: 1920,
      maxHeight: 1920,
      quality: 80,
      convertToWebP: true, // Enable WebP conversion
    });

    const outMeta = await sharp(output).metadata();
    const originalSize = input.length;
    const optimizedSize = output.length;
    const reductionPercent = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);

    await assert(
      outMeta.format === 'webp',
      'PNG converted to WebP',
      `Got format: ${outMeta.format}`
    );

    await assert(
      optimizedSize < originalSize,
      'WebP output is smaller than PNG input',
      `PNG: ${originalSize} bytes → WebP: ${optimizedSize} bytes (giảm ${reductionPercent}%)`
    );

    // WebP should be significantly smaller (typically 30-50% reduction)
    await assert(
      optimizedSize < originalSize * 0.7, // At least 30% reduction
      'WebP provides significant size reduction',
      `Reduction: ${reductionPercent}%`
    );
  }

  // ------------------------------------------------------------
  // 4) JPEG → WebP conversion (better compression)
  // ------------------------------------------------------------
  {
    const input = await sharp({
      create: {
        width: 3000,
        height: 2000,
        channels: 3,
        background: { r: 255, g: 200, b: 100 },
      },
    })
      .jpeg({ quality: 90 })
      .toBuffer();

    const output = await optimizeImage(input, {
      maxWidth: 1920,
      maxHeight: 1920,
      quality: 80,
      convertToWebP: true, // Enable WebP conversion
    });

    const outMeta = await sharp(output).metadata();
    const originalSize = input.length;
    const optimizedSize = output.length;
    const reductionPercent = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);

    await assert(
      outMeta.format === 'webp',
      'JPEG converted to WebP',
      `Got format: ${outMeta.format}`
    );

    await assert(
      optimizedSize < originalSize,
      'WebP output is smaller than JPEG input',
      `JPEG: ${originalSize} bytes → WebP: ${optimizedSize} bytes (giảm ${reductionPercent}%)`
    );
  }

  // ------------------------------------------------------------
  // 5) getOutputFormat helper function
  // ------------------------------------------------------------
  {
    await assert(
      getOutputFormat('png', true) === 'webp',
      'getOutputFormat: PNG with convertToWebP=true returns webp'
    );

    await assert(
      getOutputFormat('jpeg', true) === 'webp',
      'getOutputFormat: JPEG with convertToWebP=true returns webp'
    );

    await assert(
      getOutputFormat('png', false) === 'png',
      'getOutputFormat: PNG with convertToWebP=false keeps png'
    );

    await assert(
      getOutputFormat('webp', true) === 'webp',
      'getOutputFormat: WebP stays webp'
    );

    await assert(
      getOutputFormat('gif', true) === 'gif',
      'getOutputFormat: GIF stays gif (no conversion)'
    );
  }

  // ------------------------------------------------------------
  // Summary
  // ------------------------------------------------------------
  console.log('\n' + '='.repeat(80));
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${results.length}`);
  console.log('='.repeat(80));

  process.exit(failed > 0 ? 1 : 0);
}

if (require.main === module) {
  runImageOptimizationTests().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

export { runImageOptimizationTests };

