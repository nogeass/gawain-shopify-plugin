import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchShopifyProduct } from './fetch.js';

describe('fetchShopifyProduct', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  const opts = {
    shop: 'test-store.myshopify.com',
    accessToken: 'shpat_test_token',
    productId: '12345',
  };

  it('should call the correct Shopify Admin API URL', async () => {
    const mockProduct = { id: 12345, title: 'Test' };
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ product: mockProduct }), { status: 200 }),
    );

    await fetchShopifyProduct(opts);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://test-store.myshopify.com/admin/api/2024-01/products/12345.json',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'X-Shopify-Access-Token': 'shpat_test_token',
        }),
      }),
    );
  });

  it('should return the product from the response', async () => {
    const mockProduct = { id: 12345, title: 'Test Product', body_html: '<p>Hi</p>' };
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ product: mockProduct }), { status: 200 }),
    );

    const result = await fetchShopifyProduct(opts);
    expect(result.id).toBe(12345);
    expect(result.title).toBe('Test Product');
  });

  it('should throw on non-OK response', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response('Not Found', { status: 404, statusText: 'Not Found' }),
    );

    await expect(fetchShopifyProduct(opts)).rejects.toThrow('Shopify API error: 404');
  });

  it('should throw on 401 Unauthorized', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response('Unauthorized', { status: 401, statusText: 'Unauthorized' }),
    );

    await expect(fetchShopifyProduct(opts)).rejects.toThrow('Shopify API error: 401');
  });
});
