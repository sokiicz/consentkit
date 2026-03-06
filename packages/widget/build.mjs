import esbuild from 'esbuild';
import { copyFileSync, mkdirSync, statSync, readFileSync } from 'fs';
import { gzipSync } from 'zlib';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isWatch = process.argv.includes('--watch');

const outfile = resolve(__dirname, 'dist/widget.js');
const serverPublic = resolve(__dirname, '../../apps/server/public/widget.js');
const ftpDist = resolve(__dirname, '../../ftp/widget.js');

const buildOptions = {
  entryPoints: [resolve(__dirname, 'src/index.ts')],
  bundle: true,
  minify: true,
  format: 'iife',
  globalName: 'ConsentKit',
  outfile,
  target: ['es2017', 'chrome64', 'firefox62', 'safari11'],
  platform: 'browser',
  sourcemap: false,
  legalComments: 'none',
};

async function build() {
  await esbuild.build(buildOptions);

  try {
    mkdirSync(resolve(__dirname, '../../apps/server/public'), { recursive: true });
    copyFileSync(outfile, serverPublic);
  } catch {
    // skip silently
  }

  try {
    mkdirSync(resolve(__dirname, '../../ftp'), { recursive: true });
    copyFileSync(outfile, ftpDist);
  } catch {
    // skip silently
  }

  const raw = readFileSync(outfile);
  const gzipped = gzipSync(raw);
  const rawKB = (raw.length / 1024).toFixed(2);
  const gzKB = (gzipped.length / 1024).toFixed(2);
  console.log(`widget.js built: ${rawKB} KB raw / ${gzKB} KB gzip`);

  if (parseFloat(gzKB) > 10) {
    console.warn(`WARNING: widget.js exceeds 10 KB gzipped (${gzKB} KB). Optimise before release.`);
  }
}

if (isWatch) {
  const ctx = await esbuild.context(buildOptions);
  await ctx.watch();
  console.log('Watching for changes...');
} else {
  build().catch((err) => { console.error(err); process.exit(1); });
}
