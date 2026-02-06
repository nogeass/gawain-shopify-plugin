import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { toGawainJobInput, validateShopifyProduct } from './convert.js';
import type { ShopifyProduct } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const samplePath = path.resolve(__dirname, '../../../samples/product.sample.json');
const sampleProduct: ShopifyProduct = JSON.parse(fs.readFileSync(samplePath, 'utf-8'));

describe('toGawainJobInput', () => {
  it('should produce a valid GawainJobInput from sample product', () => {
    const result = toGawainJobInput(sampleProduct);
    expect(result.id).toBe('1234567890');
    expect(result.title).toBe('Premium Wireless Headphones');
    expect(result.description).toBeDefined();
    expect(result.images.length).toBeGreaterThan(0);
    expect(result.images.length).toBeLessThanOrEqual(3);
  });

  it('should strip HTML from description', () => {
    const result = toGawainJobInput(sampleProduct);
    expect(result.description).not.toContain('<');
    expect(result.description).not.toContain('>');
    expect(result.description).toContain('crystal-clear sound');
  });

  it('should limit images to maxImages (default 3)', () => {
    const manyImages: ShopifyProduct = {
      ...sampleProduct,
      images: [
        { id: 1, src: 'https://example.com/1.jpg', position: 1 },
        { id: 2, src: 'https://example.com/2.jpg', position: 2 },
        { id: 3, src: 'https://example.com/3.jpg', position: 3 },
        { id: 4, src: 'https://example.com/4.jpg', position: 4 },
        { id: 5, src: 'https://example.com/5.jpg', position: 5 },
      ],
    };
    const result = toGawainJobInput(manyImages);
    expect(result.images).toHaveLength(3);
  });

  it('should respect custom maxImages option', () => {
    const result = toGawainJobInput(sampleProduct, { maxImages: 1 });
    expect(result.images).toHaveLength(1);
  });

  it('should handle zero-image products gracefully', () => {
    const noImages: ShopifyProduct = {
      id: 999,
      title: 'No Image Product',
      images: [],
    };
    const result = toGawainJobInput(noImages);
    expect(result.images).toEqual([]);
  });

  it('should handle products with undefined images', () => {
    const noImagesField: ShopifyProduct = {
      id: 999,
      title: 'No Image Field Product',
    };
    const result = toGawainJobInput(noImagesField);
    expect(result.images).toEqual([]);
  });

  it('should truncate title if too long', () => {
    const longTitle: ShopifyProduct = {
      id: 888,
      title: 'A'.repeat(200),
      images: [],
    };
    const result = toGawainJobInput(longTitle);
    expect(result.title.length).toBeLessThanOrEqual(80);
    expect(result.title).toContain('…');
  });

  it('should truncate title at custom maxTitleLength', () => {
    const longTitle: ShopifyProduct = {
      id: 888,
      title: 'A'.repeat(200),
      images: [],
    };
    const result = toGawainJobInput(longTitle, { maxTitleLength: 50 });
    expect(result.title.length).toBeLessThanOrEqual(50);
    expect(result.title).toContain('…');
  });

  it('should not truncate short titles', () => {
    const result = toGawainJobInput(sampleProduct);
    expect(result.title).toBe('Premium Wireless Headphones');
    expect(result.title).not.toContain('…');
  });

  it('should truncate long descriptions', () => {
    const longDesc: ShopifyProduct = {
      id: 777,
      title: 'Test',
      body_html: '<p>' + 'X'.repeat(500) + '</p>',
      images: [],
    };
    const result = toGawainJobInput(longDesc);
    expect(result.description!.length).toBeLessThanOrEqual(200);
    expect(result.description).toContain('…');
  });

  it('should apply currency from options', () => {
    const result = toGawainJobInput(sampleProduct, { currency: 'USD' });
    expect(result.price?.currency).toBe('USD');
  });

  it('should default currency to JPY', () => {
    const result = toGawainJobInput(sampleProduct);
    expect(result.price?.currency).toBe('JPY');
  });

  it('should include templateText in metadata when provided', () => {
    const result = toGawainJobInput(sampleProduct, { templateText: 'SALE 50% OFF' });
    expect(result.metadata?.templateText).toBe('SALE 50% OFF');
  });

  it('should not include templateText in metadata when not provided', () => {
    const result = toGawainJobInput(sampleProduct);
    expect(result.metadata).not.toHaveProperty('templateText');
  });

  it('should sort images by position', () => {
    const result = toGawainJobInput(sampleProduct);
    expect(result.images[0]).toContain('headphones-front');
    expect(result.images[1]).toContain('headphones-side');
    expect(result.images[2]).toContain('headphones-case');
  });

  it('should handle product with no variants (no price)', () => {
    const noVariants: ShopifyProduct = {
      id: 666,
      title: 'No Variants',
      images: [],
    };
    const result = toGawainJobInput(noVariants);
    expect(result.price).toBeUndefined();
    expect(result.variants).toBeUndefined();
  });
});

describe('validateShopifyProduct', () => {
  it('should accept the sample product', () => {
    expect(validateShopifyProduct(sampleProduct)).toBe(true);
  });

  it('should reject null', () => {
    expect(validateShopifyProduct(null)).toBe(false);
  });

  it('should reject non-object', () => {
    expect(validateShopifyProduct('string')).toBe(false);
  });

  it('should reject missing id', () => {
    expect(validateShopifyProduct({ title: 'x' })).toBe(false);
  });

  it('should reject missing title', () => {
    expect(validateShopifyProduct({ id: 1 })).toBe(false);
  });

  it('should reject empty title', () => {
    expect(validateShopifyProduct({ id: 1, title: '   ' })).toBe(false);
  });
});
