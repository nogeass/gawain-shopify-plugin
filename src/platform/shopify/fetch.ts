/**
 * Shopify Admin API product fetcher (read-only)
 *
 * This is a reference scaffold. The access token is always caller-provided
 * and never stored or loaded from environment by this module.
 */

import type { ShopifyProduct } from './types.js';

const SHOPIFY_API_VERSION = '2024-01';

export interface FetchShopifyProductOptions {
  /** Shopify shop domain (e.g. "mystore.myshopify.com") */
  shop: string;
  /** Shopify Admin API access token (caller-provided) */
  accessToken: string;
  /** Shopify product ID */
  productId: string | number;
}

/**
 * Fetch a single product from the Shopify Admin REST API.
 *
 * The access token must be provided by the caller — this module does not
 * read tokens from environment variables or any persistent store.
 */
export async function fetchShopifyProduct(
  opts: FetchShopifyProductOptions,
): Promise<ShopifyProduct> {
  const { shop, accessToken, productId } = opts;
  const url = `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/products/${productId}.json`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(
      `Shopify API error: ${response.status} ${response.statusText} — ${body}`,
    );
  }

  const json = (await response.json()) as { product: ShopifyProduct };
  return json.product;
}
