import type { Metadata } from 'next';

export interface ImageMetadata {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
}

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  image?: string | ImageMetadata | ImageMetadata[];
  url?: string;
  type?: 'website' | 'article' | 'product';
  noindex?: boolean;
  nofollow?: boolean;
  locale?: string;
  alternateLocales?: Array<{ locale: string; url: string }>;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
}

export type MetadataGenerator = (config: SEOConfig) => Metadata;
