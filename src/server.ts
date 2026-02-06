#!/usr/bin/env node
/**
 * Optional HTTP wrapper for gawain-shopify-plugin
 *
 * Endpoints:
 *   POST /convert              — Shopify product JSON → GawainJobInput (stateless)
 *   POST /demo/create-preview  — Create a Gawain job (requires GAWAIN_API_KEY in env)
 *
 * This server does NOT handle Shopify tokens or webhooks.
 * Usage: npm run serve
 */

import * as http from 'node:http';
import { toGawainJobInput, validateShopifyProduct } from './platform/shopify/convert.js';
import type { ConvertOptions } from './platform/shopify/types.js';
import { GawainClient, createConfigFromEnv } from './gawain/client.js';
import { loadEnvConfig } from './util/env.js';

const PORT = parseInt(process.env.PORT || '3456', 10);

function parseBody(req: http.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString()));
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: http.ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

async function handleConvert(
  req: http.IncomingMessage,
  res: http.ServerResponse,
): Promise<void> {
  const body = (await parseBody(req)) as { product?: unknown; options?: ConvertOptions };

  if (!body.product || !validateShopifyProduct(body.product)) {
    sendJson(res, 400, { error: 'Invalid Shopify product' });
    return;
  }

  const result = toGawainJobInput(body.product, body.options);
  sendJson(res, 200, result);
}

async function handleCreatePreview(
  req: http.IncomingMessage,
  res: http.ServerResponse,
): Promise<void> {
  const envConfig = loadEnvConfig();
  const client = new GawainClient(createConfigFromEnv(envConfig));

  const body = (await parseBody(req)) as {
    installId?: string;
    product?: unknown;
    options?: ConvertOptions;
  };

  if (!body.product || !validateShopifyProduct(body.product)) {
    sendJson(res, 400, { error: 'Invalid Shopify product' });
    return;
  }
  if (!body.installId) {
    sendJson(res, 400, { error: 'installId is required' });
    return;
  }

  const input = toGawainJobInput(body.product, body.options);
  const job = await client.createJob(body.installId, input);
  sendJson(res, 201, job);
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'POST' && req.url === '/convert') {
      await handleConvert(req, res);
    } else if (req.method === 'POST' && req.url === '/demo/create-preview') {
      await handleCreatePreview(req, res);
    } else {
      sendJson(res, 404, { error: 'Not found' });
    }
  } catch (err) {
    sendJson(res, 500, { error: err instanceof Error ? err.message : 'Internal error' });
  }
});

server.listen(PORT, () => {
  console.info(`gawain-shopify-plugin server listening on port ${PORT}`);
});
