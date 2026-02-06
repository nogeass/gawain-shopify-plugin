# gawain-shopify-plugin

Shopify plugin for Gawain video generation API - SDK / reference implementation.

> **This repo is an SDK / reference implementation.**
> Production webhook handling and Shopify writeback must live in your own server.
> This library provides conversion functions and an API client only.
>
> **Do NOT commit `.env` files or API tokens to version control.**

## Overview

This plugin enables Shopify merchants to generate product videos using the Gawain API. It provides:

- **Conversion API**: Pure-function conversion from Shopify product JSON to Gawain job input (`toGawainJobInput`)
- **Gawain client**: `createJob` / `getJob` / `waitJob` for the Gawain video generation API
- **Anonymous previews**: Generate video previews without login using `install_id`
- **Commercial upgrade path**: Easy upgrade to commercial usage via Kinosuke

## Quick Start

### Prerequisites

- Node.js 20+
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/nogeass/gawain-shopify-plugin.git
cd gawain-shopify-plugin

# Install dependencies
npm install

# Copy environment config
cp .env.example .env
# Edit .env with your Gawain API credentials
```

### Run Demo

```bash
# Using npm
npm run demo -- --product ./samples/product.sample.json

# Using make
make demo
```

### Demo Output Example

```
=== Gawain Shopify Plugin Demo ===

Loading configuration...
Install ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890
Loading product from: ./samples/product.sample.json
Product: Premium Wireless Headphones (3 images)

Creating video generation job...
Creating job for product: 1234567890 (install_id: a1b2***7890)
Job created: job_abc123

Waiting for job completion...
  Status: pending
  Status: processing (25%)
  Status: processing (75%)

=== Results ===
Status: completed
Preview URL: https://api.gawain.example.com/preview/job_abc123.mp4

--- Commercial Usage ---
To use this video commercially, upgrade at Kinosuke:
https://kinosuke.example.com/upgrade?install_id=a1b2c3d4-e5f6-7890-abcd-ef1234567890

Demo completed successfully!
```

### Docker

```bash
# Build and run
docker-compose run --rm app
```

## Conversion API

### Input (Shopify Product JSON)

```json
{
  "id": 1234567890,
  "title": "Premium Wireless Headphones",
  "body_html": "<p>Crystal-clear sound with noise cancellation.</p>",
  "images": [
    { "id": 1001, "src": "https://example.com/front.jpg", "position": 1 },
    { "id": 1002, "src": "https://example.com/side.jpg", "position": 2 }
  ],
  "variants": [
    { "id": 2001, "title": "Black", "price": "29800" }
  ]
}
```

### Usage

```typescript
import { toGawainJobInput, GawainClient } from 'gawain-shopify-plugin';

// Convert Shopify product to Gawain format
const jobInput = toGawainJobInput(shopifyProduct, {
  currency: 'JPY',
  templateText: 'NEW ARRIVAL',
  maxImages: 2,
});

// Create a Gawain client and submit a job
const client = new GawainClient({ apiBase: '...', apiKey: '...' });
const { jobId } = await client.createJob(installId, jobInput);
const result = await client.waitJob(jobId, { timeoutMs: 120_000 });
console.log(result.previewUrl);
```

### Output (GawainJobInput)

```json
{
  "id": "1234567890",
  "title": "Premium Wireless Headphones",
  "description": "Crystal-clear sound with noise cancellation.",
  "images": [
    "https://example.com/front.jpg",
    "https://example.com/side.jpg"
  ],
  "price": { "amount": "29800", "currency": "JPY" },
  "variants": [{ "id": "2001", "title": "Black", "price": "29800" }],
  "metadata": {
    "source": "shopify",
    "templateText": "NEW ARRIVAL"
  }
}
```

### ConvertOptions

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `currency` | `string` | `'JPY'` | Currency code for price |
| `templateText` | `string` | — | Promotional template text (stored in metadata) |
| `maxImages` | `number` | `3` | Max images to include (1–3) |
| `maxTitleLength` | `number` | `80` | Truncate title beyond this length |
| `maxDescriptionLength` | `number` | `200` | Truncate description beyond this length |

## How It Works

```
┌─────────────────┐
│ Shopify Product │
│     (JSON)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│  toGawainJob    │     │    Install ID   │
│    Input()      │     │   (Anonymous)   │
└────────┬────────┘     └────────┬────────┘
         │                       │
         └───────────┬───────────┘
                     │
                     ▼
           ┌─────────────────┐
           │   Gawain API    │
           │  createJob()    │
           └────────┬────────┘
                    │
                    ▼ (waitJob)
           ┌─────────────────┐
           │  Preview URL    │
           │  + Upgrade URL  │
           └─────────────────┘
```

1. **Load product**: Read Shopify product JSON
2. **Convert format**: `toGawainJobInput(product, opts?)` → `GawainJobInput`
3. **Get install_id**: Use existing or generate new anonymous ID
4. **Create job**: `client.createJob(installId, input)` → `{ jobId }`
5. **Poll status**: `client.waitJob(jobId)` → `{ previewUrl, ... }`
6. **Get URLs**: Receive preview URL and Kinosuke upgrade URL

## HTTP Wrapper (Optional)

A lightweight HTTP server is included for integration testing:

```bash
npm run serve   # Starts on port 3456 (or PORT env var)
```

| Endpoint | Description |
|----------|-------------|
| `POST /convert` | Stateless: Shopify product JSON → GawainJobInput |
| `POST /demo/create-preview` | Creates a Gawain job (requires `GAWAIN_API_KEY` in env) |

## Fetching from Shopify Admin API

A reference scaffold for fetching products directly from the Shopify Admin REST API:

```typescript
import { fetchShopifyProduct, toGawainJobInput } from 'gawain-shopify-plugin';

const product = await fetchShopifyProduct({
  shop: 'mystore.myshopify.com',
  accessToken: 'shpat_xxxx',  // caller-provided, never stored by this SDK
  productId: '1234567890',
});

const jobInput = toGawainJobInput(product, { currency: 'JPY' });
```

A full CLI example is available at [`examples/fetch-and-convert.ts`](./examples/fetch-and-convert.ts).

## Free vs Commercial

|  | Free Preview | Commercial (Kinosuke) |
|---|---|---|
| Watermark | Yes | No |
| Resolution | Low | High |
| API Access | `install_id` only | Full API |
| Usage Rights | Personal / demo | Commercial |

## Commercial Usage

This plugin generates **preview videos** for free. For commercial usage:

1. Run the demo to generate a preview
2. The output includes a Kinosuke upgrade URL with your `install_id`
3. Subscribe at Kinosuke to unlock commercial features
4. Your `install_id` will be linked to your Kinosuke account

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `Error: Missing required env: GAWAIN_API_BASE` | Copy `.env.example` to `.env` and fill in values |
| `GawainApiError: 401 Unauthorized` | Check `GAWAIN_API_KEY` is valid |
| `GawainApiError: TIMEOUT` | Increase `GAWAIN_POLL_MAX_ATTEMPTS` in `.env` |
| `EADDRINUSE: port 3456` | Set a different `PORT` env var, or stop the other process |
| `Shopify API error: 401` | Check your Shopify access token is valid and has `read_products` scope |
| `Invalid product format` | Ensure JSON matches the Shopify product structure (needs `id` and `title`) |

## Project Structure

```
gawain-shopify-plugin/
├── src/
│   ├── gawain/
│   │   ├── client.ts          # API client (createJob, getJob, waitJob)
│   │   └── types.ts           # GawainJobInput, JobStatus, etc.
│   ├── install/
│   │   └── install_id.ts      # Install ID management (local demo)
│   ├── platform/
│   │   └── shopify/
│   │       ├── convert.ts     # toGawainJobInput (pure function)
│   │       ├── fetch.ts       # fetchShopifyProduct (Admin API scaffold)
│   │       ├── types.ts       # ShopifyProduct, ConvertOptions
│   │       └── index.ts       # Barrel export
│   ├── util/
│   │   ├── env.ts             # Environment config
│   │   └── retry.ts           # Exponential backoff
│   ├── demo.ts                # CLI demo
│   ├── server.ts              # Optional HTTP wrapper
│   └── index.ts               # Public exports
├── examples/
│   └── fetch-and-convert.ts   # Shopify → Gawain full pipeline example
├── samples/
│   └── product.sample.json
├── docs/
│   ├── architecture.md
│   ├── api_contract.md
│   ├── local_dev.md
│   └── security.md
├── .github/
│   └── workflows/ci.yml       # CI (lint, test, build, secret scan)
├── Dockerfile
├── docker-compose.yml
├── Makefile
└── package.json
```

## Configuration

Environment variables (see `.env.example`):

| Variable | Required | Description |
|----------|----------|-------------|
| `GAWAIN_API_BASE` | Yes | Gawain API base URL |
| `GAWAIN_API_KEY` | No | API key (optional for free preview; required for commercial) |
| `GAWAIN_APP_ID` | No | Application ID |
| `KINOSUKE_UPGRADE_URL` | No | Upgrade URL |

## Development

```bash
# Run tests
npm test

# Lint
npm run lint

# Type check
npm run typecheck

# Build
npm run build
```

## Disclaimer

This is a **reference implementation / SDK** for demonstration and integration purposes. It is not an official Shopify app and has not undergone Shopify app review.

For production use:
- Implement proper Shopify OAuth
- Handle webhooks and writeback in your own server
- Subscribe to Kinosuke for commercial video generation

## License

Licensed under GNU AGPL v3.0. See [LICENSE](./LICENSE).

## Support

- Issues: [GitHub Issues](https://github.com/nogeass/gawain-shopify-plugin/issues)
- Security: See [SECURITY.md](./SECURITY.md)
