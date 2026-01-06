import { run, bench, group, summary } from 'mitata';
import { keccak256 as viemKeccak256 } from 'viem';
import { loadKeccak256Wasm, keccak256 as wasmKeccak256 } from './keccak256-loader.js';

// Test data - various sizes
const data32 = new Uint8Array(32).fill(0xab);
const data1k = new Uint8Array(1024).fill(0xcd);
const data10k = new Uint8Array(10240).fill(0xef);

// Load the treeshakable keccak256.wasm (3KB vs 1.2MB)
await loadKeccak256Wasm(new URL('./wasm-loader/keccak256.wasm', import.meta.url));

summary(() => {
  group('keccak256 - 32 bytes', () => {
    bench('viem', () => viemKeccak256(data32));
    bench('voltaire (wasm)', () => wasmKeccak256(data32));
  });

  group('keccak256 - 1KB', () => {
    bench('viem', () => viemKeccak256(data1k));
    bench('voltaire (wasm)', () => wasmKeccak256(data1k));
  });

  group('keccak256 - 10KB', () => {
    bench('viem', () => viemKeccak256(data10k));
    bench('voltaire (wasm)', () => wasmKeccak256(data10k));
  });
});

await run();
