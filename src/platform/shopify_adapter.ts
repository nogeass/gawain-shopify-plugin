/**
 * Shopify platform adapter
 * Converts Shopify product data to Gawain format
 */

import type { ProductInput } from '../gawain/types.js';

/**
 * Shopify product structure (simplified)
 * See: https://shopify.dev/docs/api/admin-rest/2024-01/resources/product
 */
export interface ShopifyProduct {
  id: number | string;
  title: string;
  body_html?: string;
  vendor?: string;
  product_type?: string;
  handle?: string;
  status?: 'active' | 'archived' | 'draft';
  tags?: string;
  images?: Array<{
    id: number | string;
    src: string;
    alt?: string;
    position?: number;
  }>;
  variants?: Array<{
    id: number | string;
    title: string;
    price?: string;
    sku?: string;
    inventory_quantity?: number;
  }>;
}

/**
 * Shopify price context
 */
export interface ShopifyPriceContext {
  currency: string;
}

/**
 * Convert Shopify product to Gawain ProductInput
 */
export function convertShopifyProduct(
  product: ShopifyProduct,
  priceContext?: ShopifyPriceContext
): ProductInput {
  // Extract first variant price if available
  const firstVariant = product.variants?.[0];
  const price = firstVariant?.price
    ? {
        amount: firstVariant.price,
        currency: priceContext?.currency || 'JPY',
      }
    : undefined;

  // Extract image URLs
  const images = (product.images || [])
    .sort((a, b) => (a.position || 0) - (b.position || 0))
    .map((img) => img.src);

  // Convert variants
  const variants = product.variants?.map((v) => ({
    id: String(v.id),
    title: v.title,
    price: v.price,
  }));

  // Strip HTML tags from description (simple)
  const description = product.body_html
    ? product.body_html.replace(/<[^>]*>/g, '').trim()
    : undefined;

  return {
    id: String(product.id),
    title: product.title,
    description,
    images,
    price,
    variants,
    metadata: {
      source: 'shopify',
      handle: product.handle,
      vendor: product.vendor,
      productType: product.product_type,
    },
  };
}

/**
 * Validate Shopify product has required fields
 */
export function validateShopifyProduct(product: unknown): product is ShopifyProduct {
  if (!product || typeof product !== 'object') {
    return false;
  }

  const p = product as Record<string, unknown>;

  // Required fields
  if (typeof p.id !== 'string' && typeof p.id !== 'number') {
    return false;
  }
  if (typeof p.title !== 'string' || !p.title.trim()) {
    return false;
  }

  // Images should have at least one
  if (Array.isArray(p.images) && p.images.length === 0) {
    console.warn('Product has no images');
  }

  return true;
}
