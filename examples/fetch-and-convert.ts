#!/usr/bin/env node
/**
 * Example: Fetch a Shopify product and convert it to GawainJobInput.
 *
 * Usage:
 *   npx tsx examples/fetch-and-convert.ts \
 *     --shop mystore.myshopify.com \
 *     --token shpat_xxxx \
 *     --product-id 1234567890
 *
 * NOTE: The access token is passed as a CLI argument for demonstration only.
 *       In production, use a secure secret management solution.
 */

import { parseArgs } from 'node:util';
import { fetchShopifyProduct } from '../src/platform/shopify/fetch.js';
import { toGawainJobInput, validateShopifyProduct } from '../src/platform/shopify/convert.js';

const { values } = parseArgs({
  options: {
    shop: { type: 'string' },
    token: { type: 'string' },
    'product-id': { type: 'string' },
    help: { type: 'boolean', short: 'h' },
  },
  strict: true,
});

if (values.help || !values.shop || !values.token || !values['product-id']) {
  console.info(`
Usage:
  npx tsx examples/fetch-and-convert.ts \\
    --shop <shop-domain> \\
    --token <access-token> \\
    --product-id <product-id>

Example:
  npx tsx examples/fetch-and-convert.ts \\
    --shop mystore.myshopify.com \\
    --token shpat_xxxx \\
    --product-id 1234567890
`);
  process.exit(values.help ? 0 : 1);
}

async function main() {
  console.info(`Fetching product ${values['product-id']} from ${values.shop}...`);

  const product = await fetchShopifyProduct({
    shop: values.shop!,
    accessToken: values.token!,
    productId: values['product-id']!,
  });

  if (!validateShopifyProduct(product)) {
    console.error('Invalid product data received from Shopify.');
    process.exit(1);
  }

  console.info(`Product: ${product.title}`);
  console.info(`Images: ${product.images?.length ?? 0}`);
  console.info(`Variants: ${product.variants?.length ?? 0}`);

  const jobInput = toGawainJobInput(product, { currency: 'JPY' });

  console.info('\n--- GawainJobInput ---');
  console.info(JSON.stringify(jobInput, null, 2));
}

main().catch((err) => {
  console.error('Error:', err instanceof Error ? err.message : err);
  process.exit(1);
});
