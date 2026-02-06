/**
 * gawain-shopify-plugin
 * SDK / reference implementation for Shopify → Gawain video generation
 */

// --- Conversion (primary API) ---
export { toGawainJobInput, validateShopifyProduct } from './platform/shopify/convert.js';
export { fetchShopifyProduct, type FetchShopifyProductOptions } from './platform/shopify/fetch.js';
export type { ShopifyProduct, ConvertOptions } from './platform/shopify/types.js';

// --- Gawain client ---
export { GawainClient, createConfigFromEnv, type GawainClientConfig } from './gawain/client.js';
export {
  type ProductInput,
  type GawainJobInput,
  type CreateJobRequest,
  type CreateJobResponse,
  type GetJobResponse,
  type JobStatus,
  GawainApiError,
} from './gawain/types.js';

// --- Install ID (convenience for local/demo use) ---
export {
  getOrCreateInstallId,
  generateInstallId,
  readInstallId,
  writeInstallId,
  buildUpgradeUrl,
} from './install/install_id.js';

// --- Utilities ---
export { loadEnvConfig, maskSecret, type EnvConfig } from './util/env.js';
export { withRetry, sleep, isRetryableError, type RetryOptions } from './util/retry.js';

// --- Deprecated re-exports (will be removed in next major) ---
export { convertShopifyProduct, type ShopifyPriceContext } from './platform/shopify_adapter.js';
