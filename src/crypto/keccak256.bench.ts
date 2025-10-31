/**
 * Keccak256 Performance Benchmarks
 *
 * Measures performance of Keccak256 operations at different input sizes
 * and for various Ethereum-specific utilities.
 * Compares Noble (JavaScript) vs WASM implementations.
 */

import { Keccak256 } from "./keccak256.js";
import { Keccak256Wasm } from "./keccak256.wasm.js";

// Initialize WASM
await Keccak256Wasm.init();

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

console.log("--- hash - Uint8Array input (Noble) ---");
results.push(benchmark("hash - empty (Noble)", () => Keccak256.hash(emptyData)));
results.push(benchmark("hash - 32 bytes (Noble)", () => Keccak256.hash(data32B)));
results.push(benchmark("hash - 256 bytes (Noble)", () => Keccak256.hash(data256B)));
results.push(benchmark("hash - 1 KB (Noble)", () => Keccak256.hash(data1KB)));
results.push(benchmark("hash - 4 KB (Noble)", () => Keccak256.hash(data4KB)));
results.push(benchmark("hash - 16 KB (Noble)", () => Keccak256.hash(data16KB)));
results.push(benchmark("hash - 64 KB (Noble)", () => Keccak256.hash(data64KB)));

console.log(
  results
    .slice(-7)
    .map(
      (r) =>
        `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

console.log("\n--- hash - Uint8Array input (WASM) ---");
results.push(benchmark("hash - empty (WASM)", () => Keccak256Wasm.hash(emptyData)));
results.push(benchmark("hash - 32 bytes (WASM)", () => Keccak256Wasm.hash(data32B)));
results.push(benchmark("hash - 256 bytes (WASM)", () => Keccak256Wasm.hash(data256B)));
results.push(benchmark("hash - 1 KB (WASM)", () => Keccak256Wasm.hash(data1KB)));
results.push(benchmark("hash - 4 KB (WASM)", () => Keccak256Wasm.hash(data4KB)));
results.push(benchmark("hash - 16 KB (WASM)", () => Keccak256Wasm.hash(data16KB)));
results.push(benchmark("hash - 64 KB (WASM)", () => Keccak256Wasm.hash(data64KB)));

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

console.log("--- hashString (Noble) ---");
results.push(benchmark("hashString - empty (Noble)", () => Keccak256.hashString("")));
results.push(
  benchmark("hashString - short (Noble)", () => Keccak256.hashString(shortString)),
);
results.push(
  benchmark("hashString - medium (Noble)", () => Keccak256.hashString(mediumString)),
);
results.push(
  benchmark("hashString - long (Noble)", () => Keccak256.hashString(longString)),
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

console.log("\n--- hashString (WASM) ---");
results.push(benchmark("hashString - empty (WASM)", () => Keccak256Wasm.hashString("")));
results.push(
  benchmark("hashString - short (WASM)", () => Keccak256Wasm.hashString(shortString)),
);
results.push(
  benchmark("hashString - medium (WASM)", () => Keccak256Wasm.hashString(mediumString)),
);
results.push(
  benchmark("hashString - long (WASM)", () => Keccak256Wasm.hashString(longString)),
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

console.log("--- hashHex (Noble) ---");
results.push(benchmark("hashHex - short (Noble)", () => Keccak256.hashHex(shortHex)));
results.push(benchmark("hashHex - medium (Noble)", () => Keccak256.hashHex(mediumHex)));

console.log(
  results
    .slice(-2)
    .map(
      (r) =>
        `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

console.log("\n--- hashHex (WASM) ---");
results.push(benchmark("hashHex - short (WASM)", () => Keccak256Wasm.hashHex(shortHex)));
results.push(benchmark("hashHex - medium (WASM)", () => Keccak256Wasm.hashHex(mediumHex)));

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

console.log("--- hashMultiple (Noble) ---");
results.push(
  benchmark("hashMultiple - 3 chunks (Noble)", () =>
    Keccak256.hashMultiple([data32B, data32B, data32B]),
  ),
);
results.push(
  benchmark("hashMultiple - 10 chunks (Noble)", () =>
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

console.log("\n--- hashMultiple (WASM) ---");
results.push(
  benchmark("hashMultiple - 3 chunks (WASM)", () =>
    Keccak256Wasm.hashMultiple([data32B, data32B, data32B]),
  ),
);
results.push(
  benchmark("hashMultiple - 10 chunks (WASM)", () =>
    Keccak256Wasm.hashMultiple([
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

console.log("--- selector (Noble) ---");
results.push(
  benchmark("selector - function sig (Noble)", () => Keccak256.selector(functionSig)),
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

console.log("\n--- selector (WASM) ---");
results.push(
  benchmark("selector - function sig (WASM)", () => Keccak256Wasm.selector(functionSig)),
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

console.log("\n--- topic (Noble) ---");
results.push(benchmark("topic - event sig (Noble)", () => Keccak256.topic(eventSig)));

console.log(
  results
    .slice(-1)
    .map(
      (r) =>
        `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

console.log("\n--- topic (WASM) ---");
results.push(benchmark("topic - event sig (WASM)", () => Keccak256Wasm.topic(eventSig)));

console.log(
  results
    .slice(-1)
    .map(
      (r) =>
        `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

console.log("\n--- contractAddress (Noble) ---");
results.push(
  benchmark("contractAddress (Noble)", () => Keccak256.contractAddress(address20, 0n)),
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

console.log("\n--- contractAddress (WASM) ---");
results.push(
  benchmark("contractAddress (WASM)", () => Keccak256Wasm.contractAddress(address20, 0n)),
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

console.log("\n--- create2Address (Noble) ---");
results.push(
  benchmark("create2Address (Noble)", () =>
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

console.log("\n--- create2Address (WASM) ---");
results.push(
  benchmark("create2Address (WASM)", () =>
    Keccak256Wasm.create2Address(address20, bytes32, bytes32),
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
  { name: "32 bytes", size: 32, noble: results.find((r) => r.name === "hash - 32 bytes (Noble)"), wasm: results.find((r) => r.name === "hash - 32 bytes (WASM)") },
  { name: "256 bytes", size: 256, noble: results.find((r) => r.name === "hash - 256 bytes (Noble)"), wasm: results.find((r) => r.name === "hash - 256 bytes (WASM)") },
  { name: "1 KB", size: 1024, noble: results.find((r) => r.name === "hash - 1 KB (Noble)"), wasm: results.find((r) => r.name === "hash - 1 KB (WASM)") },
  { name: "4 KB", size: 4096, noble: results.find((r) => r.name === "hash - 4 KB (Noble)"), wasm: results.find((r) => r.name === "hash - 4 KB (WASM)") },
  { name: "16 KB", size: 16384, noble: results.find((r) => r.name === "hash - 16 KB (Noble)"), wasm: results.find((r) => r.name === "hash - 16 KB (WASM)") },
  { name: "64 KB", size: 65536, noble: results.find((r) => r.name === "hash - 64 KB (Noble)"), wasm: results.find((r) => r.name === "hash - 64 KB (WASM)") },
].filter((t) => t.noble && t.wasm) as Array<{ name: string; size: number; noble: BenchmarkResult; wasm: BenchmarkResult }>;

console.log("Noble Implementation:");
for (const test of throughputTests) {
  const bytesPerSec = test.noble.opsPerSec * test.size;
  const mbPerSec = bytesPerSec / (1024 * 1024);
  console.log(`  ${test.name}: ${mbPerSec.toFixed(2)} MB/s`);
}

console.log("\nWASM Implementation:");
for (const test of throughputTests) {
  const bytesPerSec = test.wasm.opsPerSec * test.size;
  const mbPerSec = bytesPerSec / (1024 * 1024);
  console.log(`  ${test.name}: ${mbPerSec.toFixed(2)} MB/s`);
}

console.log("\nSpeedup (WASM vs Noble):");
for (const test of throughputTests) {
  const speedup = test.wasm.opsPerSec / test.noble.opsPerSec;
  const percentage = ((speedup - 1) * 100).toFixed(1);
  console.log(`  ${test.name}: ${speedup.toFixed(2)}x (${percentage}% ${speedup > 1 ? "faster" : "slower"})`);
}

// ============================================================================
// Summary
// ============================================================================

console.log("\n");
console.log("================================================================================");
console.log("SUMMARY - Noble vs WASM Comparison");
console.log("================================================================================");
console.log(`\nTotal benchmarks run: ${results.length}`);

// Find fastest operations
const nobleResults = results.filter((r) => r.name.includes("Noble"));
const wasmResults = results.filter((r) => r.name.includes("WASM"));

const sortedNoble = [...nobleResults].sort((a, b) => b.opsPerSec - a.opsPerSec);
const sortedWasm = [...wasmResults].sort((a, b) => b.opsPerSec - a.opsPerSec);

const nobleFirst = sortedNoble[0];
const nobleLast = sortedNoble[sortedNoble.length - 1];
if (nobleFirst && nobleLast) {
  console.log(`\nNoble - Fastest: ${nobleFirst.name} - ${nobleFirst.opsPerSec.toFixed(0)} ops/sec`);
  console.log(`Noble - Slowest: ${nobleLast.name} - ${nobleLast.opsPerSec.toFixed(0)} ops/sec`);
}

const wasmFirst = sortedWasm[0];
const wasmLast = sortedWasm[sortedWasm.length - 1];
if (wasmFirst && wasmLast) {
  console.log(`\nWASM - Fastest: ${wasmFirst.name} - ${wasmFirst.opsPerSec.toFixed(0)} ops/sec`);
  console.log(`WASM - Slowest: ${wasmLast.name} - ${wasmLast.opsPerSec.toFixed(0)} ops/sec`);
}

// Overall speedup
const avgNobleOps = nobleResults.reduce((sum, r) => sum + r.opsPerSec, 0) / nobleResults.length;
const avgWasmOps = wasmResults.reduce((sum, r) => sum + r.opsPerSec, 0) / wasmResults.length;
const overallSpeedup = avgWasmOps / avgNobleOps;

console.log(`\nOverall Average:`);
console.log(`  Noble: ${avgNobleOps.toFixed(0)} ops/sec`);
console.log(`  WASM: ${avgWasmOps.toFixed(0)} ops/sec`);
console.log(`  Speedup: ${overallSpeedup.toFixed(2)}x (${((overallSpeedup - 1) * 100).toFixed(1)}% ${overallSpeedup > 1 ? "faster" : "slower"})`);

// Export results for analysis
if (typeof Bun !== "undefined") {
  const resultsFile =
    "/Users/williamcory/primitives/src/crypto/keccak256-bench-results.json";
  await Bun.write(resultsFile, JSON.stringify(results, null, 2));
  console.log(`\nResults saved to: ${resultsFile}\n`);
}
