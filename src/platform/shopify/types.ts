/**
 * Shopify platform types
 */

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
 * Options for Shopify-to-Gawain conversion
 */
export interface ConvertOptions {
  /** Override promotional template text */
  templateText?: string;
  /** Currency code (default: 'JPY') */
  currency?: string;
  /** Maximum number of images to include (1–3, default 3) */
  maxImages?: number;
  /** Maximum title length before truncation (default 80) */
  maxTitleLength?: number;
  /** Maximum description length before truncation (default 200) */
  maxDescriptionLength?: number;
}
