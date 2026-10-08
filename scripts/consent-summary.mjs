#!/usr/bin/env node
/**
 * consent-summary.mjs — daily summary of consent choices from the ConsentKit log.
 *
 * Counts, per day, how many visitors chose "accept all", "reject all" or a custom
 * mix. The output holds only counts: no visitor id, no user agent, no row is ever
 * printed. The log itself does hold identifiers, so run this where you may read it.
 *
 * Sources (pick one):
 *   --sqlite <file>    the Node server's database, apps/server/data/consent-log.db
 *   --csv-log <file>   the CSV written by ftp/consent-log.php
 *
 * Options:
 *   --since YYYY-MM-DD / --until YYYY-MM-DD   inclusive range, in the --tz time zone
 *   --tz <IANA zone>   how to cut days, default UTC (for example Europe/Prague)
 *   --events           count every logged decision. Default: count each visitor once,
 *                      by their first decision, on the day it was made
 *   --locked <keys>    categories that are always on and ignored, default "necessary"
 *   --format <f>       table (default), csv or json
 *
 * Why "once per visitor" is the default: a returning visitor who changes their mind
 * is logged again, and until 1.2.3 visitors whose browser sends Global Privacy Control or
 * Do Not Track were logged as "reject all" at every page view. Counting events would blow up
 * the reject numbers. Those automatic rejects look exactly like manual ones in the
 * log, so they still count as "reject all" once per visitor.
 *
 *   node scripts/consent-summary.mjs --sqlite apps/server/data/consent-log.db --since 2026-10-05
 */

import { readFileSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

// ─── Classification ──────────────────────────────────────────────────────────

/** @returns {'accept_all'|'reject_all'|'custom'|'unreadable'} */
export function classify(choices, lockedKeys = ['necessary']) {
  if (!choices || typeof choices !== 'object' || Array.isArray(choices)) return 'unreadable';
  const keys = Object.keys(choices).filter((k) => !lockedKeys.includes(k));
  if (keys.length === 0) return 'unreadable';
  const on = keys.filter((k) => choices[k] === true).length;
  if (on === keys.length) return 'accept_all';
  if (on === 0) return 'reject_all';
  return 'custom';
}

// ─── Day bucketing ───────────────────────────────────────────────────────────

const dayFormatters = new Map();

/** "2026-10-05" for an ISO timestamp, cut in the given time zone; null if unreadable. */
export function dayOf(timestamp, timeZone) {
  const t = Date.parse(timestamp);
  if (Number.isNaN(t)) return null;
  let fmt = dayFormatters.get(timeZone);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' });
    dayFormatters.set(timeZone, fmt);
  }
  return fmt.format(new Date(t));
}

// ─── Summary ─────────────────────────────────────────────────────────────────

/**
 * @param {{visitor: string, timestamp: string, choices: unknown}[]} rows
 * @returns {Map<string, {accept_all: number, reject_all: number, custom: number, unreadable: number}>}
 */
export function summarise(rows, { perVisitor = true, timeZone = 'UTC', since, until, lockedKeys = ['necessary'] } = {}) {
  const decisions = [];
  let skipped = 0;
  for (const r of rows) {
    const t = Date.parse(r.timestamp);
    if (Number.isNaN(t)) { skipped++; continue; }
    decisions.push({ t, visitor: r.visitor, timestamp: r.timestamp, choices: r.choices });
  }

  let chosen = decisions;
  if (perVisitor) {
    // First decision of each visitor, whatever its date, then bucketed by that date.
    decisions.sort((a, b) => a.t - b.t);
    const seen = new Set();
    chosen = [];
    for (const d of decisions) {
      if (!d.visitor) { skipped++; continue; }
      if (seen.has(d.visitor)) continue;
      seen.add(d.visitor);
      chosen.push(d);
    }
  }

  const days = new Map();
  for (const d of chosen) {
    const day = dayOf(d.timestamp, timeZone);
    if (!day) { skipped++; continue; }
    if (since && day < since) continue;
    if (until && day > until) continue;
    let row = days.get(day);
    if (!row) { row = { accept_all: 0, reject_all: 0, custom: 0, unreadable: 0 }; days.set(day, row); }
    row[classify(d.choices, lockedKeys)]++;
  }
  return { days: new Map([...days.entries()].sort(([a], [b]) => (a < b ? -1 : 1))), skipped };
}

// ─── Readers (only the columns needed; never kept beyond the count) ──────────

export function parseChoices(value) {
  if (value && typeof value === 'object') return value;
  try { return JSON.parse(String(value)); } catch { return null; }
}

/** Minimal RFC 4180 reader: quoted fields, doubled quotes, newlines inside quotes. */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else { inQuotes = false; }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field); field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field !== '' || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

function readCsvLog(file) {
  const rows = parseCsv(readFileSync(file, 'utf8'));
  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim());
  const iVisitor = header.indexOf('visitor_id');
  const iTime = header.indexOf('timestamp');
  const iChoices = header.indexOf('choices');
  if (iVisitor < 0 || iTime < 0 || iChoices < 0) {
    throw new Error('The CSV does not look like a ConsentKit log (columns visitor_id, timestamp, choices are missing).');
  }
  return rows.slice(1).map((r) => ({ visitor: r[iVisitor], timestamp: r[iTime], choices: parseChoices(r[iChoices]) }));
}

async function readSqliteLog(file) {
  const query = 'SELECT visitor_id, timestamp, choices FROM consent_logs';
  const map = (r) => ({ visitor: r.visitor_id, timestamp: r.timestamp, choices: parseChoices(r.choices) });
  try {
    const { DatabaseSync } = await import('node:sqlite');
    const db = new DatabaseSync(file, { readOnly: true });
    try { return db.prepare(query).all().map(map); } finally { db.close(); }
  } catch (err) {
    if (err && err.code !== 'ERR_UNKNOWN_BUILTIN_MODULE' && !String(err.message).includes('node:sqlite')) {
      // node:sqlite exists but failed (wrong file, locked, no such table): say so, do not fall back.
      throw new Error(`Could not read the database: ${String(err.message).split('\n')[0]}`);
    }
  }
  // Older Node: use better-sqlite3 from the server's dependencies if it is installed.
  try {
    const require = createRequire(new URL('../apps/server/package.json', import.meta.url));
    const Database = require('better-sqlite3');
    const db = new Database(file, { readonly: true });
    try { return db.prepare(query).all().map(map); } finally { db.close(); }
  } catch {
    throw new Error('Reading SQLite needs Node 22 with node:sqlite (tested on 22.23; older 22.x may need --experimental-sqlite) or better-sqlite3 installed in apps/server.');
  }
}

// ─── Output ──────────────────────────────────────────────────────────────────

function pct(part, whole) {
  return whole === 0 ? '–' : `${Math.round((part / whole) * 1000) / 10} %`;
}

export function render(days, format) {
  const lines = [...days.entries()].map(([day, r]) => {
    const total = r.accept_all + r.reject_all + r.custom;
    return { day, ...r, total };
  });
  const sum = lines.reduce(
    (a, r) => ({
      accept_all: a.accept_all + r.accept_all, reject_all: a.reject_all + r.reject_all,
      custom: a.custom + r.custom, unreadable: a.unreadable + r.unreadable, total: a.total + r.total,
    }),
    { accept_all: 0, reject_all: 0, custom: 0, unreadable: 0, total: 0 }
  );

  if (format === 'json') {
    return JSON.stringify({ days: lines, total: sum }, null, 2);
  }
  const head = ['date', 'accept_all', 'reject_all', 'custom', 'total', 'accept_share', 'reject_share', 'custom_share'];
  const row = (r, label) => [label, r.accept_all, r.reject_all, r.custom, r.total, pct(r.accept_all, r.total), pct(r.reject_all, r.total), pct(r.custom, r.total)];
  const table = [...lines.map((r) => row(r, r.day)), row(sum, 'total')];
  if (format === 'csv') {
    return [head, ...table].map((r) => r.join(',')).join('\n');
  }
  const all = [head, ...table];
  const widths = head.map((_, i) => Math.max(...all.map((r) => String(r[i]).length)));
  return all.map((r) => r.map((c, i) => (i === 0 ? String(c).padEnd(widths[i]) : String(c).padStart(widths[i]))).join('  ')).join('\n');
}

// ─── CLI ─────────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const opts = { format: 'table', tz: 'UTC', perVisitor: true, locked: ['necessary'] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => { if (i + 1 >= argv.length) throw new Error(`Missing value for ${a}`); return argv[++i]; };
    if (a === '--sqlite') opts.sqlite = next();
    else if (a === '--csv-log') opts.csvLog = next();
    else if (a === '--since') opts.since = next();
    else if (a === '--until') opts.until = next();
    else if (a === '--tz') opts.tz = next();
    else if (a === '--format') opts.format = next();
    else if (a === '--locked') opts.locked = next().split(',').map((s) => s.trim()).filter(Boolean);
    else if (a === '--events') opts.perVisitor = false;
    else if (a === '--help' || a === '-h') opts.help = true;
    else throw new Error(`Unknown option ${a}`);
  }
  return opts;
}

const USAGE = `Daily summary of ConsentKit consent choices (counts only, no identifiers).

  node scripts/consent-summary.mjs --sqlite apps/server/data/consent-log.db [options]
  node scripts/consent-summary.mjs --csv-log ftp/consent-log.csv [options]

Options: --since YYYY-MM-DD  --until YYYY-MM-DD  --tz Europe/Prague  --events
         --locked necessary  --format table|csv|json
Default counts each visitor once, by their first decision. --events counts every record.`;

async function main() {
  let opts;
  try { opts = parseArgs(process.argv.slice(2)); } catch (e) { console.error(e.message + '\n\n' + USAGE); process.exit(2); }
  if (opts.help) { console.log(USAGE); return; }
  if (!!opts.sqlite === !!opts.csvLog) { console.error('Give exactly one of --sqlite or --csv-log.\n\n' + USAGE); process.exit(2); }
  if (!['table', 'csv', 'json'].includes(opts.format)) { console.error('--format must be table, csv or json.'); process.exit(2); }
  for (const d of [opts.since, opts.until]) {
    if (d && !/^\d{4}-\d{2}-\d{2}$/.test(d)) { console.error('Dates are YYYY-MM-DD.'); process.exit(2); }
  }
  try { new Intl.DateTimeFormat('en-CA', { timeZone: opts.tz }); } catch { console.error(`Unknown time zone ${opts.tz}.`); process.exit(2); }

  const file = opts.sqlite || opts.csvLog;
  if (!existsSync(file)) { console.error(`No such file: ${file}`); process.exit(1); }

  let rows;
  try { rows = opts.sqlite ? await readSqliteLog(file) : readCsvLog(file); } catch (e) { console.error(e.message); process.exit(1); }

  const { days, skipped } = summarise(rows, {
    perVisitor: opts.perVisitor, timeZone: opts.tz, since: opts.since, until: opts.until, lockedKeys: opts.locked,
  });
  console.log(render(days, opts.format));

  const unreadable = [...days.values()].reduce((n, r) => n + r.unreadable, 0);
  console.error(
    `\n${rows.length} log rows read, ${skipped} with an unreadable time skipped, ${unreadable} with unreadable choices left out of the totals. ` +
    `Mode: ${opts.perVisitor ? 'each visitor once (first decision)' : 'every logged decision'}; days cut in ${opts.tz}.`
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  // Only the first line of an error, never row data.
  main().catch((e) => { console.error(e && e.message ? String(e.message).split('\n')[0] : 'Unexpected error.'); process.exit(1); });
}
