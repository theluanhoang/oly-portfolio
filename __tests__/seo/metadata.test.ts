import { generateMetadata, generateLocalizedMetadata } from '@/lib/seo/metadata';
import { SEO_CONSTANTS } from '@/lib/seo/constants';
import type { SEOConfig } from '@/lib/seo/types';

const originalEnv = process.env;

function runTests() {
  console.log('🧪 Running SEO Metadata Tests...\n');
  
  let passed = 0;
  let failed = 0;
  
  function test(name: string, fn: () => void | boolean) {
    try {
      const result = fn();
      if (result === false) {
        throw new Error('Test returned false');
      }
      console.log(`✅ ${name}`);
      passed++;
    } catch (error) {
      console.error(`❌ ${name}`);
      console.error(`   Error: ${error instanceof Error ? error.message : String(error)}`);
      failed++;
    }
  }
  
  function expect(actual: unknown) {
    return {
      toBe: (expected: unknown) => {
        if (actual !== expected) {
          throw new Error(`Expected ${expected}, but got ${actual}`);
        }
      },
      toBeDefined: () => {
        if (actual === undefined) {
          throw new Error('Expected value to be defined');
        }
      },
      toBeUndefined: () => {
        if (actual !== undefined) {
          throw new Error(`Expected undefined, but got ${actual}`);
        }
      },
      toContain: (substring: string) => {
        if (typeof actual !== 'string') {
          throw new Error(`Expected string, but got ${typeof actual}`);
        }
        if (!actual.includes(substring)) {
          throw new Error(`Expected string to contain "${substring}"`);
        }
      },
      not: {
        toContain: (substring: string) => {
          if (actual === undefined || actual === null) {
            throw new Error(`Cannot call toContain on undefined/null value`);
          }
          if (typeof actual !== 'string') {
            throw new Error(`Expected string, but got ${typeof actual}`);
          }
          if (actual.includes(substring)) {
            throw new Error(`Expected string not to contain "${substring}", but it does: "${actual}"`);
          }
        },
        toBe: (expected: unknown) => {
          if (actual === expected) {
            throw new Error(`Expected value not to be ${expected}`);
          }
        },
      },
      toEqual: (expected: unknown) => {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
          throw new Error(`Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
        }
      },
      toBeLessThanOrEqual: (value: number) => {
        if (typeof actual !== 'number' || actual > value) {
          throw new Error(`Expected ${actual} to be less than or equal to ${value}`);
        }
      },
    };
  }

  console.log('📋 Testing generateMetadata...\n');
  
  test('should generate basic metadata with title and description', () => {
      const config: SEOConfig = {
        title: 'Test Page',
        description: 'This is a test page description',
      };

      const metadata = generateMetadata(config);

    expect(metadata.title).toBe('Test Page');
    expect(metadata.description).toBe('This is a test page description');
  });
  
  test('should truncate description to 160 characters', () => {
      const longDescription = 'a'.repeat(200);
      const config: SEOConfig = {
        title: 'Test',
        description: longDescription,
      };

      const metadata = generateMetadata(config);
    expect(metadata.description?.length).toBeLessThanOrEqual(163); // 160 + "..."
  });
  
  test('should generate canonical URL', () => {
      const config: SEOConfig = {
        title: 'Test',
        description: 'Test description',
        url: '/test-page',
      };

      const metadata = generateMetadata(config);
    expect(metadata.alternates?.canonical).toContain('/test-page');
  });
  
  test('should generate Open Graph metadata', () => {
      const config: SEOConfig = {
        title: 'Test Page',
        description: 'Test description',
        image: '/test-image.jpg',
      };

      const metadata = generateMetadata(config);

      expect(metadata.openGraph).toBeDefined();
      expect(metadata.openGraph?.title).toBe('Test Page');
      expect(metadata.openGraph?.description).toBe('Test description');
      expect(metadata.openGraph?.images).toBeDefined();
    expect(metadata.openGraph?.images?.[0]?.url).toContain('test-image.jpg');
  });
  
  test('should generate article type metadata', () => {
      const config: SEOConfig = {
        title: 'Article Title',
        description: 'Article description',
        type: 'article',
        publishedTime: '2024-01-01T00:00:00Z',
        author: 'John Doe',
        section: 'Technology',
        tags: ['tech', 'web'],
      };

      const metadata = generateMetadata(config);

      expect(metadata.openGraph?.type).toBe('article');
      expect(metadata.openGraph?.publishedTime).toBe('2024-01-01T00:00:00Z');
      expect(metadata.openGraph?.authors).toBeDefined();
      if (metadata.openGraph?.authors) {
        const authors = metadata.openGraph.authors;
        if (Array.isArray(authors)) {
          // Authors can be string[] or Array<{name: string}>
          const hasAuthor = authors.some(a => 
            (typeof a === 'string' && a === 'John Doe') ||
            (typeof a === 'object' && a !== null && 'name' in a && a.name === 'John Doe')
          );
          expect(hasAuthor).toBe(true);
        }
      }
      expect(metadata.openGraph?.section).toBe('Technology');
    expect(metadata.openGraph?.tags).toEqual(['tech', 'web']);
  });
  
  test('should generate robots meta for noindex', () => {
      const config: SEOConfig = {
        title: 'Test',
        description: 'Test',
        noindex: true,
      };

      const metadata = generateMetadata(config);
    expect(metadata.robots?.index).toBe(false);
  });
  
  test('should generate robots meta for nofollow', () => {
      const config: SEOConfig = {
        title: 'Test',
        description: 'Test',
        nofollow: true,
      };

      const metadata = generateMetadata(config);
    expect(metadata.robots?.follow).toBe(false);
  });
  
  test('should generate keywords meta', () => {
      const config: SEOConfig = {
        title: 'Test',
        description: 'Test',
        keywords: ['keyword1', 'keyword2', 'keyword3'],
      };

      const metadata = generateMetadata(config);
    expect(metadata.keywords).toBe('keyword1, keyword2, keyword3');
  });
  
  test('should use default OG image when image is not provided', () => {
      const config: SEOConfig = {
        title: 'Test',
        description: 'Test',
      };

      const metadata = generateMetadata(config);
    expect(metadata.openGraph?.images?.[0]?.url).toContain(SEO_CONSTANTS.DEFAULT_OG_IMAGE);
  });
  
  test('should handle absolute image URLs', () => {
      const config: SEOConfig = {
        title: 'Test',
        description: 'Test',
        image: 'https://example.com/image.jpg',
      };

      const metadata = generateMetadata(config);
    expect(metadata.openGraph?.images?.[0]?.url).toBe('https://example.com/image.jpg');
  });
  
  console.log('\n📋 Testing generateLocalizedMetadata...\n');
  
  test('should generate metadata with locale and alternates', () => {
      const config: SEOConfig = {
        title: 'Test Page',
        description: 'Test description',
      };

      const metadata = generateLocalizedMetadata(config, 'en', '/test');

      expect(metadata.openGraph?.locale).toBe('en');
    expect(metadata.alternates?.languages).toBeDefined();
  });
  
  test('should generate alternate locales for all supported locales', () => {
      const config: SEOConfig = {
        title: 'Test',
        description: 'Test',
      };

      const metadata = generateLocalizedMetadata(config, 'vi', '/test');

      expect(metadata.alternates?.languages).toBeDefined();
    expect(metadata.alternates?.languages?.en).toBeDefined();
  });
  
  test('should set x-default for default locale', () => {
      const config: SEOConfig = {
        title: 'Test',
        description: 'Test',
      };

      const metadata = generateLocalizedMetadata(config, 'vi', '/test');

    expect(metadata.alternates?.['x-default']).toBeDefined();
  });
  
  test('should build correct URL with locale', () => {
      const config: SEOConfig = {
        title: 'Test',
        description: 'Test',
      };

      const metadata = generateLocalizedMetadata(config, 'en', '/test-page');

    expect(metadata.alternates?.canonical).toContain('/en/test-page');
  });
  
  test('should not add locale prefix for default locale', () => {
      const config: SEOConfig = {
        title: 'Test',
        description: 'Test',
      };

      const metadata = generateLocalizedMetadata(config, 'vi', '/test-page');

      const canonical = metadata.alternates?.canonical;
      expect(canonical).toBeDefined();
      if (canonical) {
        expect(canonical).toContain('/test-page');
        expect(canonical).not.toContain('/vi/');
      }
  });
  
  console.log('\n📋 Testing Edge Cases...\n');
  
  test('should handle empty description', () => {
      const config: SEOConfig = {
        title: 'Test',
        description: '',
      };

      const metadata = generateMetadata(config);
      // Empty description should be undefined to avoid rendering empty meta tag
      expect(metadata.description).toBeUndefined();
  });
  
  test('should handle very long title', () => {
      const longTitle = 'a'.repeat(200);
      const config: SEOConfig = {
        title: longTitle,
        description: 'Test',
      };

      const metadata = generateMetadata(config);
    expect(metadata.title).toBe(longTitle);
  });
  
  test('should handle special characters in description', () => {
      const config: SEOConfig = {
        title: 'Test',
        description: 'Test with "quotes" and <tags> and & symbols',
      };

      const metadata = generateMetadata(config);
    expect(metadata.description).toBeDefined();
  });
  
  test('should handle relative image paths', () => {
      const config: SEOConfig = {
        title: 'Test',
        description: 'Test',
        image: 'images/test.jpg',
      };

      const metadata = generateMetadata(config);
    expect(metadata.openGraph?.images?.[0]?.url).toContain('images/test.jpg');
  });
  
  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Total: ${passed + failed}\n`);
  
  if (failed > 0) {
    process.exit(1);
  }
}

// Run tests
runTests();
