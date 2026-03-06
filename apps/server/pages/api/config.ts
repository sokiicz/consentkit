/**
 * GET /api/config
 * Reads consentkit.config.json from the project root and returns it as JSON.
 * Includes CORS headers so the widget can be embedded on any domain.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// Look for the config file in the project root (two levels up from apps/server/)
const CONFIG_PATHS = [
  resolve(process.cwd(), 'consentkit.config.json'),
  resolve(process.cwd(), '../../consentkit.config.json'),
];

let cachedConfig: Record<string, unknown> | null = null;
let cacheTime = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function loadConfig(): Record<string, unknown> {
  const now = Date.now();
  if (cachedConfig && now - cacheTime < CACHE_TTL_MS) {
    return cachedConfig;
  }

  for (const configPath of CONFIG_PATHS) {
    if (existsSync(configPath)) {
      const raw = readFileSync(configPath, 'utf-8');
      cachedConfig = JSON.parse(raw) as Record<string, unknown>;
      cacheTime = now;
      return cachedConfig;
    }
  }

  throw new Error(
    'consentkit.config.json not found. Copy consentkit.config.example.json and rename it.'
  );
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const config = loadConfig();
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=300');
    res.status(200).json(config);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load config';
    res.status(500).json({ error: message });
  }
}
