/**
 * AccessList Performance Benchmarks
 *
 * Measures performance of access list operations
 */

import { AccessList } from "./access-list.js";
import type { Address } from "./address.js";
import type { Hash } from "./hash.js";

// Benchmark runner
interface BenchmarkResult {
  name: string;
  opsPerSec: number;
  avgTimeMs: number;
  iterations: number;
}

function benchmark(name: string, fn: () => void, duration = 2000): BenchmarkResult {
  // Warmup
  for (let i = 0; i < 100; i++) {
    try {
      fn();
    } catch {
      // Ignore errors during warmup
    }
  }

  // Benchmark
  const startTime = performance.now();
  let iterations = 0;
  let endTime = startTime;

  while (endTime - startTime < duration) {
    try {
      fn();
    } catch {
      // Count iteration even if it throws
    }
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

// Helper to create test addresses
function createAddress(byte: number): Address {
  const addr = new Uint8Array(20);
  addr.fill(byte);
  return addr as Address;
}

// Helper to create test storage keys
function createStorageKey(byte: number): Hash {
  const key = new Uint8Array(32);
  key.fill(byte);
  return key as Hash;
}

const addr1 = createAddress(1);
const addr2 = createAddress(2);
// const _addr3 = createAddress(3);

const key1 = createStorageKey(10);
const key2 = createStorageKey(20);
const key3 = createStorageKey(30);

// Small list
const smallList: AccessList = [
  { address: addr1, storageKeys: [key1] },
  { address: addr2, storageKeys: [key2, key3] },
];

// Medium list
const mediumList: AccessList.Item[] = [];
for (let i = 0; i < 10; i++) {
  mediumList.push({
    address: createAddress(i),
    storageKeys: [createStorageKey(i * 2), createStorageKey(i * 2 + 1)],
  });
}

// Large list
const largeList: AccessList.Item[] = [];
for (let i = 0; i < 100; i++) {
  largeList.push({
    address: createAddress(i % 50),
    storageKeys: [createStorageKey(i * 2), createStorageKey(i * 2 + 1)],
  });
}

// List with duplicates
const duplicateList: AccessList = [
  { address: addr1, storageKeys: [key1] },
  { address: addr2, storageKeys: [key2] },
  { address: addr1, storageKeys: [key2, key3] },
  { address: addr2, storageKeys: [key3] },
];

// ============================================================================
// Gas Cost Benchmarks
// ============================================================================

console.log("================================================================================");
console.log("ACCESSLIST GAS COST BENCHMARKS");
console.log("================================================================================\n");

const results: BenchmarkResult[] = [];

console.log("--- Gas Cost Calculations ---");
results.push(benchmark("gasCost - small list", () => AccessList.gasCost.call(smallList)));
results.push(benchmark("gasCost - medium list", () => AccessList.gasCost.call(mediumList)));
results.push(benchmark("gasCost - large list", () => AccessList.gasCost.call(largeList)));

console.log(
  results
    .slice(-3)
    .map(
      (r) => `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

console.log("\n--- Gas Savings Calculations ---");
results.push(
  benchmark("gasSavings - small list", () => AccessList.gasSavings.call(smallList)),
);
results.push(
  benchmark("gasSavings - medium list", () => AccessList.gasSavings.call(mediumList)),
);
results.push(
  benchmark("gasSavings - large list", () => AccessList.gasSavings.call(largeList)),
);

console.log(
  results
    .slice(-3)
    .map(
      (r) => `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

console.log("\n--- Has Savings Check ---");
results.push(
  benchmark("hasSavings - small list", () => AccessList.hasSavings.call(smallList)),
);
results.push(
  benchmark("hasSavings - medium list", () => AccessList.hasSavings.call(mediumList)),
);

console.log(
  results
    .slice(-2)
    .map(
      (r) => `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

// ============================================================================
// Query Operation Benchmarks
// ============================================================================

console.log("\n");
console.log("================================================================================");
console.log("ACCESSLIST QUERY OPERATION BENCHMARKS");
console.log("================================================================================\n");

console.log("--- Address Lookup ---");
results.push(
  benchmark("includesAddress - small list (found)", () =>
    AccessList.includesAddress.call(smallList, addr1),
  ),
);
results.push(
  benchmark("includesAddress - medium list (found)", () =>
    AccessList.includesAddress.call(mediumList, mediumList[5]!.address),
  ),
);
results.push(
  benchmark("includesAddress - large list (not found)", () =>
    AccessList.includesAddress.call(largeList, createAddress(200)),
  ),
);

console.log(
  results
    .slice(-3)
    .map(
      (r) => `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

console.log("\n--- Storage Key Lookup ---");
results.push(
  benchmark("includesStorageKey - found", () =>
    AccessList.includesStorageKey.call(smallList, addr1, key1),
  ),
);
results.push(
  benchmark("includesStorageKey - not found", () =>
    AccessList.includesStorageKey.call(smallList, addr1, createStorageKey(99)),
  ),
);

console.log(
  results
    .slice(-2)
    .map(
      (r) => `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

console.log("\n--- Keys Retrieval ---");
results.push(
  benchmark("keysFor - found", () => AccessList.keysFor.call(smallList, addr1)),
);
results.push(
  benchmark("keysFor - not found", () =>
    AccessList.keysFor.call(smallList, createAddress(99)),
  ),
);

console.log(
  results
    .slice(-2)
    .map(
      (r) => `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

// ============================================================================
// Transformation Operation Benchmarks
// ============================================================================

console.log("\n");
console.log("================================================================================");
console.log("ACCESSLIST TRANSFORMATION BENCHMARKS");
console.log("================================================================================\n");

console.log("--- Deduplication ---");
results.push(
  benchmark("deduplicate - no duplicates", () =>
    AccessList.deduplicate.call(smallList),
  ),
);
results.push(
  benchmark("deduplicate - with duplicates", () =>
    AccessList.deduplicate.call(duplicateList),
  ),
);
results.push(
  benchmark("deduplicate - large list", () => AccessList.deduplicate.call(largeList)),
);

console.log(
  results
    .slice(-3)
    .map(
      (r) => `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

console.log("\n--- Adding Addresses ---");
results.push(
  benchmark("withAddress - new address", () =>
    AccessList.withAddress.call(smallList, createAddress(99)),
  ),
);
results.push(
  benchmark("withAddress - existing address", () =>
    AccessList.withAddress.call(smallList, addr1),
  ),
);

console.log(
  results
    .slice(-2)
    .map(
      (r) => `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

console.log("\n--- Adding Storage Keys ---");
results.push(
  benchmark("withStorageKey - new key to existing address", () =>
    AccessList.withStorageKey.call(smallList, addr1, createStorageKey(99)),
  ),
);
results.push(
  benchmark("withStorageKey - duplicate key", () =>
    AccessList.withStorageKey.call(smallList, addr1, key1),
  ),
);
results.push(
  benchmark("withStorageKey - new address with key", () =>
    AccessList.withStorageKey.call(smallList, createAddress(99), key1),
  ),
);

console.log(
  results
    .slice(-3)
    .map(
      (r) => `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

console.log("\n--- Merging ---");
results.push(
  benchmark("merge - two small lists", () => AccessList.merge(smallList, smallList)),
);
results.push(
  benchmark("merge - three lists", () =>
    AccessList.merge(smallList, mediumList, duplicateList),
  ),
);
results.push(
  benchmark("merge - large lists", () => AccessList.merge(largeList, largeList)),
);

console.log(
  results
    .slice(-3)
    .map(
      (r) => `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

// ============================================================================
// Validation Benchmarks
// ============================================================================

console.log("\n");
console.log("================================================================================");
console.log("ACCESSLIST VALIDATION BENCHMARKS");
console.log("================================================================================\n");

console.log("--- Validation ---");
results.push(
  benchmark("assertValid - small list", () => AccessList.assertValid.call(smallList)),
);
results.push(
  benchmark("assertValid - medium list", () =>
    AccessList.assertValid.call(mediumList),
  ),
);
results.push(
  benchmark("assertValid - large list", () => AccessList.assertValid.call(largeList)),
);

console.log(
  results
    .slice(-3)
    .map(
      (r) => `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

// ============================================================================
// Type Guard Benchmarks
// ============================================================================

console.log("\n");
console.log("================================================================================");
console.log("ACCESSLIST TYPE GUARD BENCHMARKS");
console.log("================================================================================\n");

console.log("--- Type Guards ---");
results.push(
  benchmark("isItem - valid", () =>
    AccessList.isItem({ address: addr1, storageKeys: [key1] }),
  ),
);
results.push(benchmark("isItem - invalid", () => AccessList.isItem({ invalid: true })));
results.push(benchmark("is - valid", () => AccessList.is(smallList)));
results.push(benchmark("is - invalid", () => AccessList.is({ invalid: true })));

console.log(
  results
    .slice(-4)
    .map(
      (r) => `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

// ============================================================================
// Utility Benchmarks
// ============================================================================

console.log("\n");
console.log("================================================================================");
console.log("ACCESSLIST UTILITY BENCHMARKS");
console.log("================================================================================\n");

console.log("--- Counting Operations ---");
results.push(
  benchmark("addressCount - small list", () =>
    AccessList.addressCount.call(smallList),
  ),
);
results.push(
  benchmark("storageKeyCount - small list", () =>
    AccessList.storageKeyCount.call(smallList),
  ),
);
results.push(
  benchmark("addressCount - large list", () =>
    AccessList.addressCount.call(largeList),
  ),
);
results.push(
  benchmark("storageKeyCount - large list", () =>
    AccessList.storageKeyCount.call(largeList),
  ),
);

console.log(
  results
    .slice(-4)
    .map(
      (r) => `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

console.log("\n--- Other Utilities ---");
results.push(
  benchmark("isEmpty - empty", () => AccessList.isEmpty.call([])),
);
results.push(
  benchmark("isEmpty - non-empty", () => AccessList.isEmpty.call(smallList)),
);
results.push(benchmark("create", () => AccessList.create()));

console.log(
  results
    .slice(-3)
    .map(
      (r) => `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

// ============================================================================
// Summary
// ============================================================================

console.log("\n");
console.log("================================================================================");
console.log("Benchmarks complete!");
console.log("================================================================================");
console.log(`\nTotal benchmarks run: ${results.length}`);

// Find fastest and slowest operations
const sorted = [...results].sort((a, b) => b.opsPerSec - a.opsPerSec);
console.log(`\nFastest: ${sorted[0]!.name} - ${sorted[0]!.opsPerSec.toFixed(0)} ops/sec`);
console.log(
  `Slowest: ${sorted[sorted.length - 1]!.name} - ${sorted[sorted.length - 1]!.opsPerSec.toFixed(0)} ops/sec`,
);

// Export results for analysis
if (typeof Bun !== "undefined") {
  const resultsFile =
    "/Users/williamcory/primitives/src/primitives/access-list-results.json";
  await Bun.write(resultsFile, JSON.stringify(results, null, 2));
  console.log(`\nResults saved to: ${resultsFile}\n`);
}
