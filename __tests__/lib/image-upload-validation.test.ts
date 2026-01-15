/**
 * Image Upload Validation Test Suite
 *
 * Chạy với:
 * - npm run test:image:validation
 * - hoặc: tsx __tests__/lib/image-upload-validation.test.ts
 */

import sharp from 'sharp';
import { validateImageUpload, validateImageUploadClient } from '../../lib/validations/imageUploadValidation';

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

async function runValidationTests() {
  console.log('🔒 Bắt đầu Image Upload Validation Tests\n');
  console.log('='.repeat(80));

  // ------------------------------------------------------------
  // 1) Client-side validation - File extension
  // ------------------------------------------------------------
  {
    // Create files with actual content (size > 0) to pass size validation
    const validFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
    const invalidFile = new File(['test content'], 'test.exe', { type: 'application/x-msdownload' });

    const validResult = validateImageUploadClient(validFile);
    const invalidResult = validateImageUploadClient(invalidFile);

    await assert(validResult.valid, 'Client validation: Valid JPEG extension');
    await assert(!invalidResult.valid, 'Client validation: Invalid extension rejected');
  }

  // ------------------------------------------------------------
  // 2) Client-side validation - MIME type
  // ------------------------------------------------------------
  {
    // Create files with actual content (size > 0) to pass size validation
    const validFile = new File(['test content'], 'test.png', { type: 'image/png' });
    const invalidFile = new File(['test content'], 'test.jpg', { type: 'application/pdf' });

    const validResult = validateImageUploadClient(validFile);
    const invalidResult = validateImageUploadClient(invalidFile);

    await assert(validResult.valid, 'Client validation: Valid PNG MIME type');
    await assert(!invalidResult.valid, 'Client validation: Invalid MIME type rejected');
  }

  // ------------------------------------------------------------
  // 3) Client-side validation - File size
  // ------------------------------------------------------------
  {
    // Create a file that's exactly 50MB
    const validFile = new File([new ArrayBuffer(50 * 1024 * 1024)], 'test.jpg', { type: 'image/jpeg' });
    // Create a file that's 51MB (over limit)
    const invalidFile = new File([new ArrayBuffer(51 * 1024 * 1024)], 'test.jpg', { type: 'image/jpeg' });

    const validResult = validateImageUploadClient(validFile);
    const invalidResult = validateImageUploadClient(invalidFile);

    await assert(validResult.valid, 'Client validation: File size within limit (50MB)');
    await assert(!invalidResult.valid, 'Client validation: File size over limit rejected');
    await assert(
      invalidResult.error?.includes('too large'),
      'Client validation: File size error message is clear'
    );
  }

  // ------------------------------------------------------------
  // 4) Server-side validation - File signature (magic bytes)
  // ------------------------------------------------------------
  {
    // Create a valid JPEG
    const validJpeg = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
      },
    })
      .jpeg()
      .toBuffer();

    const validFile = new File([validJpeg], 'test.jpg', { type: 'image/jpeg' });
    const result = await validateImageUpload(validFile, validJpeg);

    await assert(result.valid, 'Server validation: Valid JPEG signature');
  }

  // ------------------------------------------------------------
  // 5) Server-side validation - Image dimensions
  // ------------------------------------------------------------
  {
    // Create a very large image (15000x15000)
    const largeImage = await sharp({
      create: {
        width: 15000,
        height: 15000,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    })
      .jpeg()
      .toBuffer();

    const largeFile = new File([largeImage], 'large.jpg', { type: 'image/jpeg' });
    const result = await validateImageUpload(largeFile, largeImage, {
      maxWidth: 10000,
      maxHeight: 10000,
    });

    await assert(!result.valid, 'Server validation: Large image dimensions rejected');
    await assert(
      result.error?.includes('dimensions'),
      'Server validation: Dimension error message is clear'
    );
  }

  // ------------------------------------------------------------
  // 6) Server-side validation - Corrupted/invalid image
  // ------------------------------------------------------------
  {
    // Create invalid image buffer (just random bytes)
    const invalidBuffer = Buffer.from('This is not an image file');
    const invalidFile = new File([invalidBuffer], 'fake.jpg', { type: 'image/jpeg' });

    const result = await validateImageUpload(invalidFile, invalidBuffer);

    await assert(!result.valid, 'Server validation: Invalid/corrupted image rejected');
  }

  // ------------------------------------------------------------
  // 7) Server-side validation - File signature mismatch
  // ------------------------------------------------------------
  {
    // Create PNG but claim it's JPEG
    const pngBuffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 0, g: 255, b: 0 },
      },
    })
      .png()
      .toBuffer();

    const fakeJpegFile = new File([pngBuffer], 'fake.jpg', { type: 'image/jpeg' });
    const result = await validateImageUpload(fakeJpegFile, pngBuffer);

    await assert(!result.valid, 'Server validation: File signature mismatch detected');
    await assert(
      result.error?.includes('signature') || result.error?.includes('corrupted'),
      'Server validation: Signature error message is clear'
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
  runValidationTests().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

export { runValidationTests };
