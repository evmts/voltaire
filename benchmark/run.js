#!/usr/bin/env node
import { execSync } from 'node:child_process';
import * as esbuild from 'esbuild';
import { existsSync, mkdirSync, statSync, readFileSync, cpSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

console.log('='.repeat(60));
console.log('  KECCAK256 BENCHMARK: VIEM vs VOLTAIRE (treeshakable WASM)');
console.log('='.repeat(60));
console.log();

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// Bundle size comparison
console.log('>>> BUNDLE SIZE <<<\n');

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

// Build voltaire (JS loader only)
await esbuild.build({
  entryPoints: ['keccak256-loader.js'],
  bundle: true,
  minify: true,
  format: 'esm',
  platform: 'node',
  outfile: 'dist/voltaire-keccak256.min.js',
  treeShaking: true,
});

const viemSize = statSync('dist/viem.min.js').size;
const voltaireJsSize = statSync('dist/voltaire-keccak256.min.js').size;
const wasmPath = 'wasm-loader/keccak256.wasm';
const wasmSize = existsSync(wasmPath) ? statSync(wasmPath).size : 0;

const viemGzip = gzipSync(readFileSync('dist/viem.min.js')).length;
const voltaireJsGzip = gzipSync(readFileSync('dist/voltaire-keccak256.min.js')).length;
const wasmGzip = existsSync(wasmPath) ? gzipSync(readFileSync(wasmPath)).length : 0;

console.log('              minified      gzipped');
console.log(`viem          ${formatSize(viemSize).padEnd(12)} ${formatSize(viemGzip)}`);
console.log(`voltaire JS   ${formatSize(voltaireJsSize).padEnd(12)} ${formatSize(voltaireJsGzip)}`);
console.log(`  +.wasm      ${formatSize(wasmSize).padEnd(12)} ${formatSize(wasmGzip)}`);
const totalSize = voltaireJsSize + wasmSize;
const totalGzip = voltaireJsGzip + wasmGzip;
console.log(`  =total      ${formatSize(totalSize).padEnd(12)} ${formatSize(totalGzip)}`);

console.log('\n--- Comparison ---\n');
const diff = totalSize - viemSize;
const pct = ((diff / viemSize) * 100).toFixed(1);
if (diff > 0) {
  console.log(`voltaire is ${formatSize(diff)} larger (+${pct}%)`);
} else {
  console.log(`voltaire is ${formatSize(-diff)} smaller (${(-pct)}%)`);
}

const diffGzip = totalGzip - viemGzip;
const pctGzip = ((diffGzip / viemGzip) * 100).toFixed(1);
if (diffGzip > 0) {
  console.log(`gzipped: voltaire is ${formatSize(diffGzip)} larger (+${pctGzip}%)`);
} else {
  console.log(`gzipped: voltaire is ${formatSize(-diffGzip)} smaller (${(-pctGzip)}%)`);
}

// Ensure dist directory exists
if (!existsSync('dist')) {
  mkdirSync('dist');
}

// Copy wasm file to dist for bundled code
if (!existsSync('dist/wasm-loader')) {
  mkdirSync('dist/wasm-loader');
}
cpSync('wasm-loader/keccak256.wasm', 'dist/wasm-loader/keccak256.wasm');

// Build speed benchmark
await esbuild.build({
  entryPoints: ['speed.js'],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: 'dist/speed.bundle.js',
  external: ['mitata'],
});

console.log('\n>>> SPEED <<<\n');
execSync('node dist/speed.bundle.js', { stdio: 'inherit' });
