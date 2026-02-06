import { describe, it, expect } from 'vitest';
import {
  convertShopifyProduct,
  validateShopifyProduct,
  type ShopifyProduct,
} from './shopify_adapter.js';

describe('shopify_adapter', () => {
  const sampleProduct: ShopifyProduct = {
    id: 123,
    title: 'Test Product',
    body_html: '<p>This is a <strong>test</strong> product.</p>',
    vendor: 'TestVendor',
    product_type: 'Electronics',
    handle: 'test-product',
    status: 'active',
    images: [
      { id: 1, src: 'https://example.com/img1.jpg', position: 2 },
      { id: 2, src: 'https://example.com/img2.jpg', position: 1 },
    ],
    variants: [
      { id: 101, title: 'Default', price: '1000' },
      { id: 102, title: 'Large', price: '1500' },
    ],
  };

  describe('convertShopifyProduct', () => {
    it('should convert basic product fields', () => {
      const result = convertShopifyProduct(sampleProduct);
      expect(result.id).toBe('123');
      expect(result.title).toBe('Test Product');
    });

    it('should strip HTML from description', () => {
      const result = convertShopifyProduct(sampleProduct);
      expect(result.description).toBe('This is a test product.');
    });

    it('should sort images by position', () => {
      const result = convertShopifyProduct(sampleProduct);
      expect(result.images).toEqual([
        'https://example.com/img2.jpg',
        'https://example.com/img1.jpg',
      ]);
    });

    it('should extract price from first variant', () => {
      const result = convertShopifyProduct(sampleProduct, { currency: 'JPY' });
      expect(result.price).toEqual({ amount: '1000', currency: 'JPY' });
    });

    it('should convert variants', () => {
      const result = convertShopifyProduct(sampleProduct);
      expect(result.variants).toHaveLength(2);
      expect(result.variants?.[0]).toEqual({ id: '101', title: 'Default', price: '1000' });
    });

    it('should include metadata', () => {
      const result = convertShopifyProduct(sampleProduct);
      expect(result.metadata).toEqual({
        source: 'shopify',
        handle: 'test-product',
        vendor: 'TestVendor',
        productType: 'Electronics',
      });
    });
  });

  describe('validateShopifyProduct', () => {
    it('should return true for valid product', () => {
      expect(validateShopifyProduct(sampleProduct)).toBe(true);
    });

    it('should return false for null', () => {
      expect(validateShopifyProduct(null)).toBe(false);
    });

    it('should return false for non-object', () => {
      expect(validateShopifyProduct('string')).toBe(false);
    });

    it('should return false for missing id', () => {
      const invalid = { title: 'Test' };
      expect(validateShopifyProduct(invalid)).toBe(false);
    });

    it('should return false for missing title', () => {
      const invalid = { id: 123 };
      expect(validateShopifyProduct(invalid)).toBe(false);
    });

    it('should return false for empty title', () => {
      const invalid = { id: 123, title: '   ' };
      expect(validateShopifyProduct(invalid)).toBe(false);
    });
  });
});
