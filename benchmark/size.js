import * as esbuild from 'esbuild';
import { statSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Ensure dist directory exists
if (!existsSync('dist')) {
  mkdirSync('dist');
}

console.log('Building bundles with esbuild (treeshake + minify)...\n');

// Build viem
await esbuild.build({
  entryPoints: ['viem-entry.js'],
  bundle: true,
  minify: true,
  format: 'esm',
  platform: 'node',
  outfile: 'dist/viem.min.js',
  treeShaking: true,
});

// Build voltaire
await esbuild.build({
  entryPoints: ['voltaire-entry.js'],
  bundle: true,
  minify: true,
  format: 'esm',
  platform: 'node',
  outfile: 'dist/voltaire.min.js',
  treeShaking: true,
  external: ['*.wasm'],
});

console.log('--- Bundle Size Comparison ---\n');

const viemSize = statSync('dist/viem.min.js').size;
const voltaireSize = statSync('dist/voltaire.min.js').size;

// Read files for gzip calculation
const viemContent = readFileSync('dist/viem.min.js');
const voltaireContent = readFileSync('dist/voltaire.min.js');
const viemGzip = gzipSync(viemContent).length;
const voltaireGzip = gzipSync(voltaireContent).length;

// Get WASM file size (required for voltaire WASM version)
const wasmPath = join(__dirname, 'wasm-loader', 'primitives.wasm');
const wasmSize = existsSync(wasmPath) ? statSync(wasmPath).size : 0;
const wasmGzip = existsSync(wasmPath) ? gzipSync(readFileSync(wasmPath)).length : 0;

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

console.log('           minified      gzipped');
console.log(`viem       ${formatSize(viemSize).padEnd(12)} ${formatSize(viemGzip)}`);
console.log(`voltaire   ${formatSize(voltaireSize).padEnd(12)} ${formatSize(voltaireGzip)}`);
if (wasmSize > 0) {
  console.log(`  +.wasm   ${formatSize(wasmSize).padEnd(12)} ${formatSize(wasmGzip)}`);
  const totalSize = voltaireSize + wasmSize;
  const totalGzip = voltaireGzip + wasmGzip;
  console.log(`  =total   ${formatSize(totalSize).padEnd(12)} ${formatSize(totalGzip)}`);
}

console.log('\n--- Comparison ---\n');
const totalVoltaire = voltaireSize + wasmSize;
const totalVoltaireGzip = voltaireGzip + wasmGzip;

const diff = totalVoltaire - viemSize;
const pct = ((diff / viemSize) * 100).toFixed(1);
if (diff > 0) {
  console.log(`voltaire (with WASM) is ${formatSize(diff)} larger (+${pct}%)`);
} else {
  console.log(`voltaire (with WASM) is ${formatSize(-diff)} smaller (${-pct}%)`);
}

const diffGzip = totalVoltaireGzip - viemGzip;
const pctGzip = ((diffGzip / viemGzip) * 100).toFixed(1);
if (diffGzip > 0) {
  console.log(`gzipped: voltaire is ${formatSize(diffGzip)} larger (+${pctGzip}%)`);
} else {
  console.log(`gzipped: voltaire is ${formatSize(-diffGzip)} smaller (${-pctGzip}%)`);
}
