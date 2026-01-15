/**
 * Image Processing Queue Test Suite
 *
 * Chạy với:
 * - npm run test:image:queue
 * - hoặc: tsx __tests__/lib/image-processing-queue.test.ts
 */

import sharp from 'sharp';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { imageProcessingQueue } from '../../lib/workers/imageProcessingQueue';

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

async function runQueueTests() {
  console.log('\n🔄 Bắt đầu Image Processing Queue Tests\n');
  console.log('='.repeat(80));

  const tempDir = join(process.cwd(), 'public', 'uploads', 'temp', 'test');
  await mkdir(tempDir, { recursive: true });

  // Cleanup function
  const cleanup = async () => {
    // Cleanup is handled by queue itself
  };

  try {
    // ------------------------------------------------------------
    // 1) Create job and verify initial status
    // ------------------------------------------------------------
    console.log('\n📋 Test 1: Tạo job và verify initial status');
    console.log('-'.repeat(80));
    {
      const testImage = await sharp({
        create: {
          width: 1000,
          height: 1000,
          channels: 3,
          background: { r: 255, g: 0, b: 0 },
        },
      })
        .jpeg()
        .toBuffer();

      const tempFilePath = join(tempDir, `test_${Date.now()}.jpg`);
      await writeFile(tempFilePath, testImage);

      console.log(`   📤 Tạo job cho file: test.jpg`);
      const jobId = await imageProcessingQueue.createJob(tempFilePath, 'test.jpg');
      const job = imageProcessingQueue.getJob(jobId);

      console.log(`   ✅ Job ID: ${jobId}`);
      console.log(`   📊 Status: ${job?.status}`);

      await assert(!!jobId, 'Job created successfully');
      await assert(!!job, 'Job can be retrieved');
      await assert(
        job?.status === 'pending' || job?.status === 'processing',
        'Job initial status is pending or processing'
      );
      await assert(job?.tempFilePath === tempFilePath, 'Job has correct temp file path');
    }

    // ------------------------------------------------------------
    // 2) Wait for job completion and verify result
    // ------------------------------------------------------------
    console.log('\n📋 Test 2: Đợi job hoàn thành và verify kết quả');
    console.log('-'.repeat(80));
    {
      const testImage = await sharp({
        create: {
          width: 2000,
          height: 1500,
          channels: 3,
          background: { r: 0, g: 255, b: 0 },
        },
      })
        .jpeg()
        .toBuffer();

      const tempFilePath = join(tempDir, `test_complete_${Date.now()}.jpg`);
      await writeFile(tempFilePath, testImage);

      console.log(`   📤 Tạo job cho file: test_complete.jpg`);
      const jobId = await imageProcessingQueue.createJob(tempFilePath, 'test_complete.jpg');
      console.log(`   ✅ Job ID: ${jobId}`);
      
      // Wait for job to complete (max 10 seconds)
      let job = imageProcessingQueue.getJob(jobId);
      let attempts = 0;
      const maxAttempts = 20; // 20 * 500ms = 10 seconds

      console.log(`   ⏳ Đang xử lý...`);
      while (job && job.status !== 'completed' && job.status !== 'failed' && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        job = imageProcessingQueue.getJob(jobId);
        attempts++;
        
        if (job?.progress !== undefined) {
          process.stdout.write(`\r   📊 Progress: ${job.progress}% | Status: ${job.status}`);
        }
      }
      console.log(''); // New line after progress

      await assert(!!job, 'Job still exists after processing');
      
      if (job) {
        console.log(`   ✅ Status cuối: ${job.status}`);
        await assert(
          job.status === 'completed' || job.status === 'failed',
          'Job completed or failed',
          `Status: ${job.status}`
        );

        if (job.status === 'completed') {
          console.log(`   📁 Output URL: ${job.outputUrl}`);
          console.log(`   📄 Output filename: ${job.outputFilename}`);
          await assert(!!job.outputUrl, 'Job has output URL');
          await assert(!!job.outputFilename, 'Job has output filename');
          await assert(job.progress === 100, 'Job progress is 100%');
        }
      }
    }

    // ------------------------------------------------------------
    // 3) Test job status tracking
    // ------------------------------------------------------------
    console.log('\n📋 Test 3: Test job status tracking');
    console.log('-'.repeat(80));
    {
      const testImage = await sharp({
        create: {
          width: 500,
          height: 500,
          channels: 3,
          background: { r: 0, g: 0, b: 255 },
        },
      })
        .png()
        .toBuffer();

      const tempFilePath = join(tempDir, `test_status_${Date.now()}.png`);
      await writeFile(tempFilePath, testImage);

      console.log(`   📤 Tạo job cho file: test_status.png`);
      const jobId = await imageProcessingQueue.createJob(tempFilePath, 'test_status.png');
      const job = imageProcessingQueue.getJob(jobId);

      console.log(`   ✅ Job ID: ${jobId}`);
      console.log(`   📅 Created at: ${new Date(job?.createdAt || 0).toISOString()}`);
      console.log(`   📊 Status: ${job?.status}`);

      await assert(!!job?.createdAt, 'Job has createdAt timestamp');
      await assert(
        job?.status === 'pending' || job?.status === 'processing',
        'Job is in pending or processing state'
      );
    }

    // ------------------------------------------------------------
    // 4) Test upload 20 ảnh cùng lúc (concurrent processing)
    // ------------------------------------------------------------
    console.log('\n📋 Test 4: Upload 20 ảnh cùng lúc (concurrent processing)');
    console.log('-'.repeat(80));
    {
      const numImages = 20;
      const jobIds: string[] = [];
      const startTime = Date.now();

      console.log(`   📤 Tạo ${numImages} jobs...`);
      
      // Create 20 jobs
      for (let i = 0; i < numImages; i++) {
        const testImage = await sharp({
          create: {
            width: 1500 + i * 100, // Vary sizes
            height: 1000 + i * 50,
            channels: 3,
            background: {
              r: Math.floor(Math.random() * 255),
              g: Math.floor(Math.random() * 255),
              b: Math.floor(Math.random() * 255),
            },
          },
        })
          .jpeg({ quality: 90 })
          .toBuffer();

        const tempFilePath = join(tempDir, `batch_${i}_${Date.now()}.jpg`);
        await writeFile(tempFilePath, testImage);

        const jobId = await imageProcessingQueue.createJob(tempFilePath, `image_${i}.jpg`);
        jobIds.push(jobId);
      }

      console.log(`   ✅ Đã tạo ${jobIds.length} jobs`);
      console.log(`   ⏳ Đang xử lý ${numImages} ảnh...\n`);

      // Monitor all jobs
      const completedJobs = new Set<string>();
      const failedJobs = new Set<string>();
      let attempts = 0;
      const maxAttempts = 60; // 60 * 500ms = 30 seconds max

      while (completedJobs.size + failedJobs.size < numImages && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        attempts++;

        for (const jobId of jobIds) {
          if (completedJobs.has(jobId) || failedJobs.has(jobId)) continue;

          const job = imageProcessingQueue.getJob(jobId);
          if (job) {
            if (job.status === 'completed') {
              completedJobs.add(jobId);
            } else if (job.status === 'failed') {
              failedJobs.add(jobId);
            }
          }
        }

        // Show progress
        const processing = numImages - completedJobs.size - failedJobs.size;
        const completed = completedJobs.size;
        const failed = failedJobs.size;
        const progress = ((completed + failed) / numImages * 100).toFixed(1);
        
        process.stdout.write(
          `\r   📊 Progress: ${progress}% | ✅ Completed: ${completed} | ❌ Failed: ${failed} | ⏳ Processing: ${processing}`
        );
      }
      console.log(''); // New line after progress

      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);

      console.log(`\n   ⏱️  Thời gian xử lý: ${duration}s`);
      console.log(`   ✅ Hoàn thành: ${completedJobs.size}/${numImages}`);
      console.log(`   ❌ Thất bại: ${failedJobs.size}/${numImages}`);
      
      if (completedJobs.size > 0) {
        const avgTimePerImage = (parseFloat(duration) / completedJobs.size).toFixed(2);
        console.log(`   📈 Trung bình: ${avgTimePerImage}s/ảnh`);
      }

      // Verify results
      await assert(
        completedJobs.size === numImages,
        'All jobs completed successfully',
        `Completed: ${completedJobs.size}/${numImages}`
      );

      // Verify all completed jobs have output URLs
      for (const jobId of Array.from(completedJobs)) {
        const job = imageProcessingQueue.getJob(jobId);
        await assert(!!job?.outputUrl, `Job ${jobId} has output URL`);
        await assert(job?.progress === 100, `Job ${jobId} progress is 100%`);
      }
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

    // Cleanup
    await cleanup();

    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('Fatal error:', error);
    await cleanup();
    process.exit(1);
  }
}

if (require.main === module) {
  runQueueTests().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

export { runQueueTests };
