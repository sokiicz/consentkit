/**
 * POST /api/consent
 * Stores a consent record in a local SQLite database (consent-log.db).
 * Enforces the retention period configured in consentLogging.retentionDays.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import Database from 'better-sqlite3';
import { resolve, dirname } from 'path';
import { existsSync, readFileSync, mkdirSync } from 'fs';

// ─── Database setup ─────────────────────────────────────────────────────────

const DB_DIR = resolve(process.cwd(), 'data');
const DB_PATH = resolve(DB_DIR, 'consent-log.db');

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (_db) return _db;

  mkdirSync(DB_DIR, { recursive: true });

  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.pragma('synchronous = NORMAL');

  _db.exec(`
    CREATE TABLE IF NOT EXISTS consent_logs (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      visitor_id   TEXT    NOT NULL,
      timestamp    TEXT    NOT NULL,
      choices      TEXT    NOT NULL,
      banner_version TEXT  NOT NULL,
      user_agent   TEXT,
      created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_created_at ON consent_logs (created_at);
    CREATE INDEX IF NOT EXISTS idx_visitor_id ON consent_logs (visitor_id);
  `);

  return _db;
}

// ─── Config helpers ──────────────────────────────────────────────────────────

const CONFIG_PATHS = [
  resolve(process.cwd(), 'consentkit.config.json'),
  resolve(process.cwd(), '../../consentkit.config.json'),
];

interface ConsentLoggingConfig {
  enabled: boolean;
  retentionDays: number;
}

function getRetentionDays(): number {
  for (const p of CONFIG_PATHS) {
    if (existsSync(p)) {
      try {
        const cfg = JSON.parse(readFileSync(p, 'utf-8')) as {
          consentLogging?: ConsentLoggingConfig;
        };
        return cfg.consentLogging?.retentionDays ?? 1825;
      } catch {
        // fall through
      }
    }
  }
  return 1825; // GDPR-safe default: 5 years
}

// ─── Request validation ──────────────────────────────────────────────────────

interface ConsentBody {
  visitorId: string;
  timestamp: string;
  choices: Record<string, boolean>;
  bannerVersion: string;
  userAgent: string;
}

function isValidBody(body: unknown): body is ConsentBody {
  if (!body || typeof body !== 'object') return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.visitorId === 'string' &&
    typeof b.timestamp === 'string' &&
    typeof b.choices === 'object' &&
    b.choices !== null &&
    typeof b.bannerVersion === 'string'
  );
}

// ─── Route handler ───────────────────────────────────────────────────────────

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!isValidBody(req.body)) {
    res.status(400).json({ error: 'Invalid request body' });
    return;
  }

  const { visitorId, timestamp, choices, bannerVersion, userAgent } = req.body;

  // Sanitise visitorId — must look like a UUID
  if (!/^[0-9a-f-]{36}$/i.test(visitorId)) {
    res.status(400).json({ error: 'Invalid visitorId format' });
    return;
  }

  try {
    const db = getDb();
    const retentionDays = getRetentionDays();

    // Insert new record
    const insert = db.prepare(`
      INSERT INTO consent_logs (visitor_id, timestamp, choices, banner_version, user_agent, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `);

    insert.run(
      visitorId,
      timestamp,
      JSON.stringify(choices),
      bannerVersion,
      userAgent || null
    );

    // Enforce retention: delete records older than retentionDays
    const prune = db.prepare(`
      DELETE FROM consent_logs
      WHERE created_at < datetime('now', ? || ' days')
    `);
    prune.run(`-${retentionDays}`);

    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('ConsentKit: failed to log consent', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '16kb',
    },
  },
};
