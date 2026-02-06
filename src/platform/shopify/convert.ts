/**
 * Shopify → Gawain conversion (pure functions, no I/O)
 */

import type { GawainJobInput } from '../../gawain/types.js';
import type { ShopifyProduct, ConvertOptions } from './types.js';

const DEFAULT_MAX_IMAGES = 3;
const DEFAULT_MAX_TITLE_LENGTH = 80;
const DEFAULT_MAX_DESCRIPTION_LENGTH = 200;

/**
 * Strip HTML tags from a string.
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

/**
 * Truncate a string to maxLength, appending '…' if truncated.
 */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1) + '…';
}

/**
 * Convert a Shopify product to Gawain job input.
 *
 * Pure function — no side effects, no I/O.
 */
export function toGawainJobInput(
  product: ShopifyProduct,
  opts?: ConvertOptions,
): GawainJobInput {
  const maxImages = Math.max(1, Math.min(opts?.maxImages ?? DEFAULT_MAX_IMAGES, 3));
  const maxTitleLength = opts?.maxTitleLength ?? DEFAULT_MAX_TITLE_LENGTH;
  const maxDescriptionLength = opts?.maxDescriptionLength ?? DEFAULT_MAX_DESCRIPTION_LENGTH;

  // Title: truncate if too long
  const title = truncate(product.title, maxTitleLength);

  // Description: strip HTML, then truncate
  const rawDescription = product.body_html ? stripHtml(product.body_html) : undefined;
  const description = rawDescription
    ? truncate(rawDescription, maxDescriptionLength)
    : undefined;

  // Images: sort by position, limit count
  const images = (product.images || [])
    .sort((a, b) => (a.position || 0) - (b.position || 0))
    .map((img) => img.src)
    .slice(0, maxImages);

  // Price from first variant
  const firstVariant = product.variants?.[0];
  const price = firstVariant?.price
    ? {
        amount: firstVariant.price,
        currency: opts?.currency || 'JPY',
      }
    : undefined;

  // Variants
  const variants = product.variants?.map((v) => ({
    id: String(v.id),
    title: v.title,
    price: v.price,
  }));

  return {
    id: String(product.id),
    title,
    description,
    images,
    price,
    variants,
    metadata: {
      source: 'shopify',
      handle: product.handle,
      vendor: product.vendor,
      productType: product.product_type,
      ...(opts?.templateText ? { templateText: opts.templateText } : {}),
    },
  };
}

/**
 * Validate that a value has the required shape of a ShopifyProduct.
 */
export function validateShopifyProduct(product: unknown): product is ShopifyProduct {
  if (!product || typeof product !== 'object') {
    return false;
  }

  const p = product as Record<string, unknown>;

  if (typeof p.id !== 'string' && typeof p.id !== 'number') {
    return false;
  }
  if (typeof p.title !== 'string' || !p.title.trim()) {
    return false;
  }

  return true;
}
