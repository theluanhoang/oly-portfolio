/**
 * Test suite for Structured Data (JSON-LD) generation
 */

import {
  generateOrganizationSchema,
  generateWebSiteSchema,
  generateBreadcrumbSchema,
  generateArticleSchema,
  generateImageObjectSchema,
  generateCollectionPageSchema,
  generateCreativeWorkSchema,
  generateProductSchema,
} from '@/lib/seo/structured-data';
import { SEO_CONSTANTS } from '@/lib/seo/constants';

// Simple test framework
function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✅ ${name}`);
  } catch (error) {
    console.error(`❌ ${name} - ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

function expect<T>(actual: T) {
  return {
    toBe(expected: T) {
      if (actual !== expected) {
        throw new Error(`Expected ${JSON.stringify(actual)} to be ${JSON.stringify(expected)}`);
      }
    },
    toContain(expected: string) {
      if (typeof actual === 'string' && !actual.includes(expected)) {
        throw new Error(`Expected "${actual}" to contain "${expected}"`);
      }
    },
    toBeDefined() {
      if (actual === undefined || actual === null) {
        throw new Error(`Expected value to be defined, but got ${actual}`);
      }
    },
    toEqual(expected: T) {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`);
      }
    },
  };
}

// Tests
test('should generate Organization schema with required fields', () => {
  const schema = generateOrganizationSchema();
  
  expect(schema['@context']).toBe('https://schema.org');
  expect(schema['@type']).toBe('Organization');
  expect(schema.name).toBe(SEO_CONSTANTS.SITE_NAME);
  expect(schema.url).toBe(SEO_CONSTANTS.SITE_URL);
  expect(schema.logo).toBeDefined();
  expect(schema.contactPoint).toBeDefined();
  expect((schema.contactPoint as { '@type': string })['@type']).toBe('ContactPoint');
});

test('should generate WebSite schema with searchAction', () => {
  const schema = generateWebSiteSchema('vi');
  
  expect(schema['@context']).toBe('https://schema.org');
  expect(schema['@type']).toBe('WebSite');
  expect(schema.name).toBe(SEO_CONSTANTS.SITE_NAME);
  expect(schema.url).toBe(SEO_CONSTANTS.SITE_URL);
  expect(schema.potentialAction).toBeDefined();
  
  const action = schema.potentialAction as { '@type': string; target: unknown; 'query-input': string };
  expect(action['@type']).toBe('SearchAction');
  expect(action['query-input']).toBe('required name=search_term_string');
});

test('should generate BreadcrumbList schema', () => {
  const items = [
    { name: 'Home', url: 'https://example.com' },
    { name: 'Projects', url: 'https://example.com/projects' },
    { name: 'Project Name', url: 'https://example.com/projects/project-name' },
  ];
  
  const schema = generateBreadcrumbSchema(items);
  
  expect(schema['@context']).toBe('https://schema.org');
  expect(schema['@type']).toBe('BreadcrumbList');
  expect(schema.itemListElement).toBeDefined();
  
  const elements = schema.itemListElement as Array<{ position: number; name: string; item: string }>;
  expect(elements.length).toBe(3);
  expect(elements[0].position).toBe(1);
  expect(elements[0].name).toBe('Home');
  expect(elements[2].position).toBe(3);
  expect(elements[2].name).toBe('Project Name');
});

test('should generate Article schema with all fields', () => {
  const schema = generateArticleSchema({
    headline: 'Test Article',
    description: 'Test description',
    image: 'https://example.com/image.jpg',
    datePublished: '2024-01-01T00:00:00Z',
    dateModified: '2024-01-02T00:00:00Z',
    author: 'John Doe',
    publisher: {
      name: 'Test Publisher',
      logo: '/logo.svg',
    },
  });
  
  expect(schema['@context']).toBe('https://schema.org');
  expect(schema['@type']).toBe('Article');
  expect(schema.headline).toBe('Test Article');
  expect(schema.description).toBe('Test description');
  expect(schema.datePublished).toBe('2024-01-01T00:00:00Z');
  expect(schema.dateModified).toBe('2024-01-02T00:00:00Z');
  expect(schema.author).toBeDefined();
  expect(schema.publisher).toBeDefined();
});

test('should generate ImageObject schema', () => {
  const schema = generateImageObjectSchema({
    url: '/images/test.jpg',
    caption: 'Test caption',
    name: 'Test Image',
    description: 'Test description',
  });
  
  expect(schema['@context']).toBe('https://schema.org');
  expect(schema['@type']).toBe('ImageObject');
  expect(schema.contentUrl).toContain(SEO_CONSTANTS.SITE_URL);
  expect(schema.caption).toBe('Test caption');
  expect(schema.name).toBe('Test Image');
});

test('should generate CollectionPage schema', () => {
  const schema = generateCollectionPageSchema({
    name: 'Projects',
    description: 'List of projects',
    url: '/projects',
    numberOfItems: 10,
    mainEntity: [
      { '@type': 'CreativeWork', name: 'Project 1', url: '/projects/project-1' },
      { '@type': 'CreativeWork', name: 'Project 2', url: '/projects/project-2' },
    ],
  });
  
  expect(schema['@context']).toBe('https://schema.org');
  expect(schema['@type']).toBe('CollectionPage');
  expect(schema.name).toBe('Projects');
  expect(schema.numberOfItems).toBe(10);
  expect(schema.mainEntity).toBeDefined();
  
  const mainEntity = schema.mainEntity as { '@type': string; numberOfItems: number; itemListElement: unknown[] };
  expect(mainEntity['@type']).toBe('ItemList');
  expect(mainEntity.numberOfItems).toBe(2);
});

test('should generate CreativeWork schema', () => {
  const schema = generateCreativeWorkSchema({
    name: 'Test Project',
    description: 'Test description',
    image: '/images/project.jpg',
    creator: 'John Doe',
    dateCreated: '2024-01-01T00:00:00Z',
    keywords: ['architecture', 'design'],
    genre: 'Architecture',
    inLanguage: 'en',
  });
  
  expect(schema['@context']).toBe('https://schema.org');
  expect(schema['@type']).toBe('CreativeWork');
  expect(schema.name).toBe('Test Project');
  expect(schema.description).toBe('Test description');
  expect(schema.creator).toBeDefined();
  expect(schema.keywords).toBe('architecture, design');
  expect(schema.genre).toBe('Architecture');
  expect(schema.inLanguage).toBe('en');
});

test('should generate Product schema', () => {
  const schema = generateProductSchema({
    name: 'Test Product',
    description: 'Test description',
    image: '/images/product.jpg',
    category: 'Furniture',
    brand: 'OLY Studio',
    sku: 'TEST-001',
  });
  
  expect(schema['@context']).toBe('https://schema.org');
  expect(schema['@type']).toBe('Product');
  expect(schema.name).toBe('Test Product');
  expect(schema.description).toBe('Test description');
  expect(schema.category).toBe('Furniture');
  expect(schema.brand).toBeDefined();
  expect(schema.sku).toBe('TEST-001');
});

test('should handle multiple images in Article schema', () => {
  const schema = generateArticleSchema({
    headline: 'Test',
    description: 'Test',
    image: ['/image1.jpg', '/image2.jpg'],
  });
  
  expect(Array.isArray(schema.image)).toBe(true);
  const images = schema.image as string[];
  expect(images.length).toBe(2);
});

test('should handle relative URLs in schemas', () => {
  const schema = generateImageObjectSchema({
    url: '/images/test.jpg',
  });
  
  expect(schema.contentUrl).toContain(SEO_CONSTANTS.SITE_URL);
  expect(schema.url).toContain(SEO_CONSTANTS.SITE_URL);
});

console.log('\n✅ All structured data tests passed!');
