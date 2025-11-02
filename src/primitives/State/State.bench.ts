/**
 * State Module Benchmarks
 *
 * Measures performance of StorageKey operations and state constants
 */

import { StorageKey, EMPTY_CODE_HASH, EMPTY_TRIE_ROOT } from "./index.js";
import type { Address } from "../Address/index.js";

// ============================================================================
// Benchmark Runner
// ============================================================================

interface BenchmarkResult {
  name: string;
  opsPerSec: number;
  avgTimeMs: number;
  iterations: number;
}

function benchmark(
  name: string,
  fn: () => void,
  duration = 2000,
): BenchmarkResult {
  // Warmup
  for (let i = 0; i < 100; i++) {
    fn();
  }

  // Benchmark
  const startTime = performance.now();
  let iterations = 0;
  let endTime = startTime;

  while (endTime - startTime < duration) {
    fn();
    iterations++;
    endTime = performance.now();
  }

  const totalTime = endTime - startTime;
  const avgTimeMs = totalTime / iterations;
  const opsPerSec = (iterations / totalTime) * 1000;

  return {
    name,
    opsPerSec,
    avgTimeMs,
    iterations,
  };
}

// ============================================================================
// Test Data
// ============================================================================

function createAddress(byte: number): Address {
  const addr = new Uint8Array(20);
  addr.fill(byte);
  return addr as Address;
}

const addr1 = createAddress(0x01);
const addr2 = createAddress(0x02);
const addr3 = createAddress(0x03);
const zeroAddr = createAddress(0x00);
const maxAddr = createAddress(0xff);

const key1: StorageKey = { address: addr1, slot: 0n };
const key2: StorageKey = { address: addr1, slot: 42n };
const key3: StorageKey = { address: addr2, slot: 100n };
const keyLarge: StorageKey = {
  address: addr3,
  slot: 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn,
};

const str1 = StorageKey.toString(key1);
const str2 = StorageKey.toString(key2);

// ============================================================================
// Constant Access Benchmarks
// ============================================================================

console.log(
  "================================================================================",
);
console.log("STATE CONSTANTS BENCHMARKS");
console.log(
  "================================================================================\n",
);

const results: BenchmarkResult[] = [];

console.log("--- Constant Access ---");
results.push(
  benchmark("Access EMPTY_CODE_HASH", () => {
    void EMPTY_CODE_HASH;
  }),
);
results.push(
  benchmark("Access EMPTY_TRIE_ROOT", () => {
    void EMPTY_TRIE_ROOT;
  }),
);
results.push(
  benchmark("Read EMPTY_CODE_HASH byte", () => {
    void EMPTY_CODE_HASH[0];
  }),
);
results.push(
  benchmark("Compare constants", () => {
    void (EMPTY_CODE_HASH !== EMPTY_TRIE_ROOT);
  }),
);

console.log(
  results
    .slice(-4)
    .map(
      (r) =>
        `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

// ============================================================================
// StorageKey Creation Benchmarks
// ============================================================================

console.log("\n");
console.log(
  "================================================================================",
);
console.log("STORAGE KEY CREATION BENCHMARKS");
console.log(
  "================================================================================\n",
);

console.log("--- Key Creation ---");
results.push(
  benchmark("StorageKey.create - simple", () => {
    void StorageKey.create(addr1, 0n);
  }),
);
results.push(
  benchmark("StorageKey.create - with slot", () => {
    void StorageKey.create(addr1, 42n);
  }),
);
results.push(
  benchmark("StorageKey.create - large slot", () => {
    void StorageKey.create(
      addr1,
      0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn,
    );
  }),
);
results.push(
  benchmark("Literal key creation", () => {
    void ({ address: addr1, slot: 42n } as StorageKey);
  }),
);

console.log(
  results
    .slice(-4)
    .map(
      (r) =>
        `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

// ============================================================================
// StorageKey Type Guard Benchmarks
// ============================================================================

console.log("\n");
console.log(
  "================================================================================",
);
console.log("STORAGE KEY TYPE GUARD BENCHMARKS");
console.log(
  "================================================================================\n",
);

console.log("--- Type Checking ---");
results.push(
  benchmark("StorageKey.is - valid key", () => {
    void StorageKey.is(key1);
  }),
);
results.push(
  benchmark("StorageKey.is - invalid (null)", () => {
    void StorageKey.is(null);
  }),
);
results.push(
  benchmark("StorageKey.is - invalid (object)", () => {
    void StorageKey.is({ foo: "bar" });
  }),
);
results.push(
  benchmark("StorageKey.is - invalid (no slot)", () => {
    void StorageKey.is({ address: addr1 });
  }),
);

console.log(
  results
    .slice(-4)
    .map(
      (r) =>
        `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

// ============================================================================
// StorageKey Equality Benchmarks
// ============================================================================

console.log("\n");
console.log(
  "================================================================================",
);
console.log("STORAGE KEY EQUALITY BENCHMARKS");
console.log(
  "================================================================================\n",
);

console.log("--- Equality Checks ---");
results.push(
  benchmark("StorageKey.equals - same keys", () => {
    void StorageKey.equals(key1, key1);
  }),
);
results.push(
  benchmark("StorageKey.equals - equal keys", () => {
    const k1: StorageKey = { address: addr1, slot: 42n };
    const k2: StorageKey = { address: addr1, slot: 42n };
    void StorageKey.equals(k1, k2);
  }),
);
results.push(
  benchmark("StorageKey.equals - different slots", () => {
    void StorageKey.equals(key1, key2);
  }),
);
results.push(
  benchmark("StorageKey.equals - different addresses", () => {
    void StorageKey.equals(key1, key3);
  }),
);
results.push(
  benchmark("StorageKey.equals - with conversion", () => {
    void StorageKey.equals(key1, key2);
  }),
);

console.log(
  results
    .slice(-5)
    .map(
      (r) =>
        `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

// ============================================================================
// StorageKey String Conversion Benchmarks
// ============================================================================

console.log("\n");
console.log(
  "================================================================================",
);
console.log("STORAGE KEY STRING CONVERSION BENCHMARKS");
console.log(
  "================================================================================\n",
);

console.log("--- String Conversion ---");
results.push(
  benchmark("StorageKey.toString - zero slot", () => {
    void StorageKey.toString(key1);
  }),
);
results.push(
  benchmark("StorageKey.toString - small slot", () => {
    void StorageKey.toString(key2);
  }),
);
results.push(
  benchmark("StorageKey.toString - large slot", () => {
    void StorageKey.toString(keyLarge);
  }),
);
results.push(
  benchmark("StorageKey.toString - with conversion", () => {
    void StorageKey.toString(key2);
  }),
);

console.log(
  results
    .slice(-4)
    .map(
      (r) =>
        `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

console.log("\n--- String Parsing ---");
results.push(
  benchmark("StorageKey.fromString - valid", () => {
    void StorageKey.fromString(str1);
  }),
);
results.push(
  benchmark("StorageKey.fromString - with slot", () => {
    void StorageKey.fromString(str2);
  }),
);
results.push(
  benchmark("StorageKey.fromString - invalid", () => {
    void StorageKey.fromString("invalid");
  }),
);

console.log(
  results
    .slice(-3)
    .map(
      (r) =>
        `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

console.log("\n--- Round-trip Conversion ---");
results.push(
  benchmark("Round-trip: toString + fromString", () => {
    const str = StorageKey.toString(key2);
    void StorageKey.fromString(str);
  }),
);

console.log(
  results
    .slice(-1)
    .map(
      (r) =>
        `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

// ============================================================================
// StorageKey Hash Code Benchmarks
// ============================================================================

console.log("\n");
console.log(
  "================================================================================",
);
console.log("STORAGE KEY HASH CODE BENCHMARKS");
console.log(
  "================================================================================\n",
);

console.log("--- Hash Code Generation ---");
results.push(
  benchmark("StorageKey.hashCode - zero slot", () => {
    void StorageKey.hashCode(key1);
  }),
);
results.push(
  benchmark("StorageKey.hashCode - small slot", () => {
    void StorageKey.hashCode(key2);
  }),
);
results.push(
  benchmark("StorageKey.hashCode - large slot", () => {
    void StorageKey.hashCode(keyLarge);
  }),
);
results.push(
  benchmark("StorageKey.hashCode - with conversion", () => {
    void StorageKey.hashCode(key2);
  }),
);

console.log(
  results
    .slice(-4)
    .map(
      (r) =>
        `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

// ============================================================================
// Map Operations Benchmarks
// ============================================================================

console.log("\n");
console.log(
  "================================================================================",
);
console.log("MAP OPERATIONS BENCHMARKS");
console.log(
  "================================================================================\n",
);

console.log("--- Map Operations ---");

// Pre-populate map for get benchmarks
const testMap = new Map<string, bigint>();
for (let i = 0; i < 100; i++) {
  const key: StorageKey = { address: createAddress(i % 20), slot: BigInt(i) };
  testMap.set(StorageKey.toString(key), BigInt(i * 100));
}

results.push(
  benchmark("Map.set with StorageKey", () => {
    const map = new Map<string, bigint>();
    const keyStr = StorageKey.toString(key2);
    map.set(keyStr, 100n);
  }),
);

results.push(
  benchmark("Map.get with StorageKey", () => {
    const keyStr = StorageKey.toString(key2);
    void testMap.get(keyStr);
  }),
);

results.push(
  benchmark("Map.has with StorageKey", () => {
    const keyStr = StorageKey.toString(key2);
    void testMap.has(keyStr);
  }),
);

results.push(
  benchmark("Map.delete with StorageKey", () => {
    const map = new Map(testMap);
    const keyStr = StorageKey.toString(key2);
    map.delete(keyStr);
  }),
);

console.log(
  results
    .slice(-4)
    .map(
      (r) =>
        `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

// ============================================================================
// Batch Operations Benchmarks
// ============================================================================

console.log("\n");
console.log(
  "================================================================================",
);
console.log("BATCH OPERATIONS BENCHMARKS");
console.log(
  "================================================================================\n",
);

console.log("--- Batch Operations ---");

results.push(
  benchmark("Create 10 StorageKeys", () => {
    for (let i = 0; i < 10; i++) {
      void ({ address: addr1, slot: BigInt(i) } as StorageKey);
    }
  }),
);

results.push(
  benchmark("Convert 10 keys to string", () => {
    const keys: StorageKey[] = [];
    for (let i = 0; i < 10; i++) {
      keys.push({ address: addr1, slot: BigInt(i) });
    }
    for (const key of keys) {
      void StorageKey.toString(key);
    }
  }),
);

results.push(
  benchmark("Populate Map with 10 keys", () => {
    const map = new Map<string, bigint>();
    for (let i = 0; i < 10; i++) {
      const key: StorageKey = { address: addr1, slot: BigInt(i) };
      map.set(StorageKey.toString(key), BigInt(i * 100));
    }
  }),
);

results.push(
  benchmark("Lookup 10 keys in Map", () => {
    for (let i = 0; i < 10; i++) {
      const key: StorageKey = { address: addr1, slot: BigInt(i) };
      void testMap.get(StorageKey.toString(key));
    }
  }),
);

console.log(
  results
    .slice(-4)
    .map(
      (r) =>
        `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

// ============================================================================
// Edge Case Benchmarks
// ============================================================================

console.log("\n");
console.log(
  "================================================================================",
);
console.log("EDGE CASE BENCHMARKS");
console.log(
  "================================================================================\n",
);

console.log("--- Edge Cases ---");

results.push(
  benchmark("Zero address and slot", () => {
    const key: StorageKey = { address: zeroAddr, slot: 0n };
    void StorageKey.toString(key);
  }),
);

results.push(
  benchmark("Max address and slot", () => {
    const key: StorageKey = {
      address: maxAddr,
      slot: 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn,
    };
    void StorageKey.toString(key);
  }),
);

results.push(
  benchmark("Equality check - identical addresses", () => {
    const k1: StorageKey = { address: addr1, slot: 0n };
    const k2: StorageKey = { address: addr1, slot: 0n };
    void StorageKey.equals(k1, k2);
  }),
);

results.push(
  benchmark("Hash collision check", () => {
    const hash1 = StorageKey.hashCode(key1);
    const hash2 = StorageKey.hashCode(key2);
    void (hash1 === hash2);
  }),
);

console.log(
  results
    .slice(-4)
    .map(
      (r) =>
        `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

// ============================================================================
// Summary
// ============================================================================

console.log("\n");
console.log(
  "================================================================================",
);
console.log("BENCHMARK SUMMARY");
console.log(
  "================================================================================\n",
);

console.log(`Total benchmarks run: ${results.length}`);
console.log(
  `Total iterations: ${results.reduce((sum, r) => sum + r.iterations, 0)}`,
);

// Find fastest and slowest operations
const sorted = [...results].sort((a, b) => b.opsPerSec - a.opsPerSec);
console.log(`\nFastest: ${sorted[0]!.name} (${sorted[0]!.opsPerSec.toFixed(0)} ops/sec)`);
console.log(
  `Slowest: ${sorted[sorted.length - 1]!.name} (${sorted[sorted.length - 1]!.opsPerSec.toFixed(0)} ops/sec)`,
);

// Export results for analysis
if (typeof Bun !== "undefined") {
  const resultsFile =
    "/Users/williamcory/primitives/src/primitives/state-results.json";
  await Bun.write(resultsFile, JSON.stringify(results, null, 2));
  console.log(`\nResults saved to: ${resultsFile}\n`);
}
