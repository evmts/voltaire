/**
 * RIPEMD160 Benchmarks
 *
 * Performance tests for RIPEMD160 hash function
 * at different input sizes.
 */

import { bench, describe } from 'vitest';
import { Ripemd160 } from './ripemd160.js';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Benchmark results storage
const results: Record<string, { opsPerSec: number; avgTime: number }> = {};

describe('Ripemd160 Performance', () => {
  // Small input (32 bytes - typical hash size)
  const small = new Uint8Array(32).fill(42);
  bench('hash 32 bytes', () => {
    Ripemd160.hash(small);
  }, {
    time: 1000,
    iterations: 10000,
  });

  // Medium input (1 KB)
  const medium = new Uint8Array(1024).fill(42);
  bench('hash 1 KB', () => {
    Ripemd160.hash(medium);
  }, {
    time: 1000,
    iterations: 5000,
  });

  // Large input (64 KB)
  const large = new Uint8Array(64 * 1024).fill(42);
  bench('hash 64 KB', () => {
    Ripemd160.hash(large);
  }, {
    time: 1000,
    iterations: 1000,
  });

  // String hashing
  const str = 'The quick brown fox jumps over the lazy dog';
  bench('hashString', () => {
    Ripemd160.hashString(str);
  }, {
    time: 1000,
    iterations: 10000,
  });

  // Empty input
  bench('hash empty', () => {
    Ripemd160.hash(new Uint8Array([]));
  }, {
    time: 1000,
    iterations: 10000,
  });
});

// Manual benchmark runner for detailed results
function runBenchmarks() {
  console.log('Running RIPEMD160 benchmarks...\n');

  const testCases = [
    { name: 'hash_32_bytes', size: 32 },
    { name: 'hash_1_KB', size: 1024 },
    { name: 'hash_64_KB', size: 64 * 1024 },
    { name: 'hash_1_MB', size: 1024 * 1024 },
  ];

  for (const { name, size } of testCases) {
    const data = new Uint8Array(size).fill(42);
    const iterations = size > 10000 ? 1000 : 10000;

    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      Ripemd160.hash(data);
    }
    const end = performance.now();

    const totalTime = end - start;
    const avgTime = totalTime / iterations;
    const opsPerSec = Math.round(1000 / avgTime);

    results[name] = { opsPerSec, avgTime };

    console.log(`${name}:`);
    console.log(`  Iterations: ${iterations}`);
    console.log(`  Total time: ${totalTime.toFixed(2)}ms`);
    console.log(`  Avg time: ${avgTime.toFixed(4)}ms`);
    console.log(`  Ops/sec: ${opsPerSec.toLocaleString()}`);
    console.log();
  }

  // String benchmark
  {
    const str = 'The quick brown fox jumps over the lazy dog';
    const iterations = 10000;

    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      Ripemd160.hashString(str);
    }
    const end = performance.now();

    const totalTime = end - start;
    const avgTime = totalTime / iterations;
    const opsPerSec = Math.round(1000 / avgTime);

    results['hashString'] = { opsPerSec, avgTime };

    console.log('hashString:');
    console.log(`  Iterations: ${iterations}`);
    console.log(`  Total time: ${totalTime.toFixed(2)}ms`);
    console.log(`  Avg time: ${avgTime.toFixed(4)}ms`);
    console.log(`  Ops/sec: ${opsPerSec.toLocaleString()}`);
    console.log();
  }

  // Save results
  const outputPath = join(__dirname, 'ripemd160-results.json');
  writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`Results saved to ${outputPath}`);
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runBenchmarks();
}
