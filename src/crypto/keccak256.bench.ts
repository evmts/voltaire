/**
 * Keccak256 Performance Benchmarks
 *
 * Measures performance of Keccak256 operations at different input sizes
 * and for various Ethereum-specific utilities
 */

import { Keccak256 } from "./keccak256.js";

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

const emptyData = new Uint8Array(0);
const data32B = new Uint8Array(32);
data32B.fill(1);
const data256B = new Uint8Array(256);
data256B.fill(2);
const data1KB = new Uint8Array(1024);
data1KB.fill(3);
const data4KB = new Uint8Array(4096);
data4KB.fill(4);
const data16KB = new Uint8Array(16384);
data16KB.fill(5);
const data64KB = new Uint8Array(65536);
data64KB.fill(6);

const shortString = "hello";
const mediumString = "The quick brown fox jumps over the lazy dog";
const longString = "a".repeat(1000);

const shortHex = "0x1234";
const mediumHex =
  "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

const functionSig = "transfer(address,uint256)";
const eventSig = "Transfer(address,address,uint256)";

const address20 = new Uint8Array(20);
address20.fill(0x42);
const bytes32 = new Uint8Array(32);
bytes32.fill(0x11);

// ============================================================================
// Hash Benchmarks - Different Sizes
// ============================================================================

console.log("================================================================================");
console.log("KECCAK256 HASH BENCHMARKS - INPUT SIZES");
console.log("================================================================================\n");

const results: BenchmarkResult[] = [];

console.log("--- hash - Uint8Array input ---");
results.push(benchmark("hash - empty", () => Keccak256.hash(emptyData)));
results.push(benchmark("hash - 32 bytes", () => Keccak256.hash(data32B)));
results.push(benchmark("hash - 256 bytes", () => Keccak256.hash(data256B)));
results.push(benchmark("hash - 1 KB", () => Keccak256.hash(data1KB)));
results.push(benchmark("hash - 4 KB", () => Keccak256.hash(data4KB)));
results.push(benchmark("hash - 16 KB", () => Keccak256.hash(data16KB)));
results.push(benchmark("hash - 64 KB", () => Keccak256.hash(data64KB)));

console.log(
  results
    .slice(-7)
    .map(
      (r) =>
        `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

// ============================================================================
// String Hash Benchmarks
// ============================================================================

console.log("\n");
console.log("================================================================================");
console.log("KECCAK256 STRING BENCHMARKS");
console.log("================================================================================\n");

console.log("--- hashString ---");
results.push(benchmark("hashString - empty", () => Keccak256.hashString("")));
results.push(
  benchmark("hashString - short", () => Keccak256.hashString(shortString)),
);
results.push(
  benchmark("hashString - medium", () => Keccak256.hashString(mediumString)),
);
results.push(
  benchmark("hashString - long", () => Keccak256.hashString(longString)),
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
// Hex Hash Benchmarks
// ============================================================================

console.log("\n");
console.log("================================================================================");
console.log("KECCAK256 HEX BENCHMARKS");
console.log("================================================================================\n");

console.log("--- hashHex ---");
results.push(benchmark("hashHex - short", () => Keccak256.hashHex(shortHex)));
results.push(benchmark("hashHex - medium", () => Keccak256.hashHex(mediumHex)));

console.log(
  results
    .slice(-2)
    .map(
      (r) =>
        `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

// ============================================================================
// Multiple Chunks Benchmark
// ============================================================================

console.log("\n");
console.log("================================================================================");
console.log("KECCAK256 MULTIPLE CHUNKS BENCHMARK");
console.log("================================================================================\n");

console.log("--- hashMultiple ---");
results.push(
  benchmark("hashMultiple - 3 chunks", () =>
    Keccak256.hashMultiple([data32B, data32B, data32B]),
  ),
);
results.push(
  benchmark("hashMultiple - 10 chunks", () =>
    Keccak256.hashMultiple([
      data32B,
      data32B,
      data32B,
      data32B,
      data32B,
      data32B,
      data32B,
      data32B,
      data32B,
      data32B,
    ]),
  ),
);

console.log(
  results
    .slice(-2)
    .map(
      (r) =>
        `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

// ============================================================================
// Ethereum Utilities Benchmarks
// ============================================================================

console.log("\n");
console.log("================================================================================");
console.log("KECCAK256 ETHEREUM UTILITIES BENCHMARKS");
console.log("================================================================================\n");

console.log("--- selector ---");
results.push(
  benchmark("selector - function sig", () => Keccak256.selector(functionSig)),
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

console.log("\n--- topic ---");
results.push(benchmark("topic - event sig", () => Keccak256.topic(eventSig)));

console.log(
  results
    .slice(-1)
    .map(
      (r) =>
        `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

console.log("\n--- contractAddress ---");
results.push(
  benchmark("contractAddress", () => Keccak256.contractAddress(address20, 0n)),
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

console.log("\n--- create2Address ---");
results.push(
  benchmark("create2Address", () =>
    Keccak256.create2Address(address20, bytes32, bytes32),
  ),
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
// Throughput Analysis
// ============================================================================

console.log("\n");
console.log("================================================================================");
console.log("THROUGHPUT ANALYSIS");
console.log("================================================================================\n");

// Calculate MB/s for different sizes
const throughputTests = [
  { name: "32 bytes", size: 32, result: results.find((r) => r.name === "hash - 32 bytes")! },
  { name: "256 bytes", size: 256, result: results.find((r) => r.name === "hash - 256 bytes")! },
  { name: "1 KB", size: 1024, result: results.find((r) => r.name === "hash - 1 KB")! },
  { name: "4 KB", size: 4096, result: results.find((r) => r.name === "hash - 4 KB")! },
  { name: "16 KB", size: 16384, result: results.find((r) => r.name === "hash - 16 KB")! },
  { name: "64 KB", size: 65536, result: results.find((r) => r.name === "hash - 64 KB")! },
];

for (const test of throughputTests) {
  const bytesPerSec = test.result.opsPerSec * test.size;
  const mbPerSec = bytesPerSec / (1024 * 1024);
  console.log(`  ${test.name}: ${mbPerSec.toFixed(2)} MB/s`);
}

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
console.log(`\nFastest: ${sorted[0].name} - ${sorted[0].opsPerSec.toFixed(0)} ops/sec`);
console.log(
  `Slowest: ${sorted[sorted.length - 1].name} - ${sorted[sorted.length - 1].opsPerSec.toFixed(0)} ops/sec`,
);

// Group by operation type
console.log("\n--- Operation Categories ---");
const categories = {
  "Hash (bytes)": results.filter((r) => r.name.startsWith("hash - ")),
  "Hash (string)": results.filter((r) => r.name.startsWith("hashString")),
  "Hash (hex)": results.filter((r) => r.name.startsWith("hashHex")),
  "Hash (multiple)": results.filter((r) => r.name.startsWith("hashMultiple")),
  "Ethereum utils": results.filter(
    (r) =>
      r.name.startsWith("selector") ||
      r.name.startsWith("topic") ||
      r.name.includes("Address"),
  ),
};

for (const [category, categoryResults] of Object.entries(categories)) {
  if (categoryResults.length > 0) {
    const avgOps =
      categoryResults.reduce((sum, r) => sum + r.opsPerSec, 0) /
      categoryResults.length;
    console.log(
      `${category}: ${avgOps.toFixed(0)} ops/sec average (${categoryResults.length} tests)`,
    );
  }
}

// Export results for analysis
if (typeof Bun !== "undefined") {
  const resultsFile =
    "/Users/williamcory/primitives/src/crypto/keccak256-results.json";
  await Bun.write(resultsFile, JSON.stringify(results, null, 2));
  console.log(`\nResults saved to: ${resultsFile}\n`);
}
