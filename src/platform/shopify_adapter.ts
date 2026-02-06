/**
 * @deprecated Import from './shopify/convert.js' instead.
 */

export { validateShopifyProduct } from './shopify/convert.js';
export type { ShopifyProduct } from './shopify/types.js';

import type { GawainJobInput } from '../gawain/types.js';
import type { ShopifyProduct } from './shopify/types.js';
import { toGawainJobInput } from './shopify/convert.js';

/** @deprecated Use ConvertOptions from './shopify/types.js' */
export interface ShopifyPriceContext {
  currency: string;
}

/**
 * @deprecated Use `toGawainJobInput` from './shopify/convert.js' instead.
 */
export function convertShopifyProduct(
  product: ShopifyProduct,
  priceContext?: ShopifyPriceContext,
): GawainJobInput {
  return toGawainJobInput(product, {
    currency: priceContext?.currency,
  });
}
