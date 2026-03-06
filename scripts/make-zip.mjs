/**
 * scripts/make-zip.mjs
 *
 * Builds the widget then packages ftp/ into dist/consentkit-ftp.zip.
 * Run with: pnpm zip
 *
 * Requires: zip CLI (Linux/macOS) or 7z (Windows via Scoop/Chocolatey).
 * If neither is available, just zip the ftp/ folder manually.
 */

import { execSync, spawnSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// ── Read version from root package.json ──────────────────────────────────────
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf-8'));
const version = `v${pkg.version}`;
const zipName = `consentkit-ftp-${version}.zip`;

// ── Build the widget first ────────────────────────────────────────────────────
console.log('Building widget...');
execSync('pnpm --filter @consentkit/widget build', { cwd: root, stdio: 'inherit' });

// ── Verify ftp/widget.js was produced ────────────────────────────────────────
if (!existsSync(resolve(root, 'ftp/widget.js'))) {
  console.error('ftp/widget.js not found after build. Something went wrong.');
  process.exit(1);
}

// ── Create dist/ ─────────────────────────────────────────────────────────────
mkdirSync(resolve(root, 'dist'), { recursive: true });
const outPath = resolve(root, 'dist', zipName);

// ── Detect zip tool ───────────────────────────────────────────────────────────
function hasCommand(cmd) {
  const r = spawnSync(process.platform === 'win32' ? 'where' : 'which', [cmd]);
  return r.status === 0;
}

const ftpDir = resolve(root, 'ftp');
let success = false;

if (hasCommand('zip')) {
  execSync(
    `zip -j "${outPath}" widget.js consentkit.config.json consent-log.php embed-example.html README.md`,
    { cwd: ftpDir, stdio: 'inherit' }
  );
  success = true;
} else if (hasCommand('7z')) {
  execSync(
    `7z a "${outPath}" widget.js consentkit.config.json consent-log.php embed-example.html README.md`,
    { cwd: ftpDir, stdio: 'inherit' }
  );
  success = true;
}

if (success) {
  console.log(`\nCreated: dist/${zipName}`);
  console.log('Upload this ZIP to a GitHub release or distribute directly.\n');
} else {
  console.log('\nNo zip tool found.');
  console.log(`Manually zip the contents of the ftp/ folder and name it ${zipName}`);
  console.log('Files to include: widget.js, consentkit.config.json, consent-log.php, embed-example.html, README.md\n');
}
