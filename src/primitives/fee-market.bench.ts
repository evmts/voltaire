/**
 * Fee Market Benchmarks
 *
 * Measures performance of EIP-1559 and EIP-4844 fee calculations
 */

import { FeeMarket } from "./fee-market.js";

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

const testState: FeeMarket.State = {
  gasUsed: 20_000_000n,
  gasLimit: 30_000_000n,
  baseFee: 1_000_000_000n,
  excessBlobGas: 393216n,
  blobGasUsed: 262144n,
};

const testTxParams: FeeMarket.TxFeeParams = {
  maxFeePerGas: 2_000_000_000n,
  maxPriorityFeePerGas: 1_000_000_000n,
  baseFee: 800_000_000n,
};

const testBlobTxParams: FeeMarket.BlobTxFeeParams = {
  ...testTxParams,
  maxFeePerBlobGas: 10_000_000n,
  blobBaseFee: 5_000_000n,
  blobCount: 3n,
};

// ============================================================================
// Base Fee Calculation Benchmarks (EIP-1559)
// ============================================================================

console.log("================================================================================");
console.log("FEE MARKET BENCHMARKS - EIP-1559");
console.log("================================================================================\n");

const results: BenchmarkResult[] = [];

console.log("--- Base Fee Calculations ---");
results.push(
  benchmark("calculateBaseFee - at target", () =>
    FeeMarket.calculateBaseFee(15_000_000n, 30_000_000n, 1_000_000_000n),
  ),
);
results.push(
  benchmark("calculateBaseFee - above target", () =>
    FeeMarket.calculateBaseFee(25_000_000n, 30_000_000n, 1_000_000_000n),
  ),
);
results.push(
  benchmark("calculateBaseFee - below target", () =>
    FeeMarket.calculateBaseFee(10_000_000n, 30_000_000n, 1_000_000_000n),
  ),
);
results.push(
  benchmark("calculateBaseFee - full block", () =>
    FeeMarket.calculateBaseFee(30_000_000n, 30_000_000n, 1_000_000_000n),
  ),
);
results.push(
  benchmark("calculateBaseFee - empty block", () =>
    FeeMarket.calculateBaseFee(0n, 30_000_000n, 1_000_000_000n),
  ),
);

console.log(
  results
    .slice(-5)
    .map(
      (r) => `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

// ============================================================================
// Blob Fee Calculation Benchmarks (EIP-4844)
// ============================================================================

console.log("\n");
console.log("================================================================================");
console.log("FEE MARKET BENCHMARKS - EIP-4844");
console.log("================================================================================\n");

console.log("--- Blob Fee Calculations ---");
results.push(
  benchmark("calculateBlobBaseFee - no excess", () =>
    FeeMarket.calculateBlobBaseFee(0n),
  ),
);
results.push(
  benchmark("calculateBlobBaseFee - at target", () =>
    FeeMarket.calculateBlobBaseFee(393216n),
  ),
);
results.push(
  benchmark("calculateBlobBaseFee - high excess", () =>
    FeeMarket.calculateBlobBaseFee(1_000_000n),
  ),
);
results.push(
  benchmark("calculateBlobBaseFee - very high excess", () =>
    FeeMarket.calculateBlobBaseFee(10_000_000n),
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

console.log("\n--- Excess Blob Gas Calculations ---");
results.push(
  benchmark("calculateExcessBlobGas - below target", () =>
    FeeMarket.calculateExcessBlobGas(0n, 131072n),
  ),
);
results.push(
  benchmark("calculateExcessBlobGas - at target", () =>
    FeeMarket.calculateExcessBlobGas(0n, 393216n),
  ),
);
results.push(
  benchmark("calculateExcessBlobGas - above target", () =>
    FeeMarket.calculateExcessBlobGas(0n, 786432n),
  ),
);
results.push(
  benchmark("calculateExcessBlobGas - with previous excess", () =>
    FeeMarket.calculateExcessBlobGas(393216n, 393216n),
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

// ============================================================================
// Transaction Fee Calculation Benchmarks
// ============================================================================

console.log("\n");
console.log("================================================================================");
console.log("FEE MARKET BENCHMARKS - TRANSACTION FEES");
console.log("================================================================================\n");

console.log("--- Transaction Fee Calculations ---");
results.push(
  benchmark("calculateTxFee - normal", () => FeeMarket.calculateTxFee(testTxParams)),
);
results.push(
  benchmark("calculateTxFee - capped by maxFee", () =>
    FeeMarket.calculateTxFee({
      maxFeePerGas: 1_500_000_000n,
      maxPriorityFeePerGas: 1_000_000_000n,
      baseFee: 800_000_000n,
    }),
  ),
);
results.push(
  benchmark("calculateTxFee - zero priority", () =>
    FeeMarket.calculateTxFee({
      maxFeePerGas: 1_000_000_000n,
      maxPriorityFeePerGas: 0n,
      baseFee: 1_000_000_000n,
    }),
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

console.log("\n--- Blob Transaction Fee Calculations ---");
results.push(
  benchmark("calculateBlobTxFee - normal", () =>
    FeeMarket.calculateBlobTxFee(testBlobTxParams),
  ),
);
results.push(
  benchmark("calculateBlobTxFee - 1 blob", () =>
    FeeMarket.calculateBlobTxFee({ ...testBlobTxParams, blobCount: 1n }),
  ),
);
results.push(
  benchmark("calculateBlobTxFee - 6 blobs", () =>
    FeeMarket.calculateBlobTxFee({ ...testBlobTxParams, blobCount: 6n }),
  ),
);
results.push(
  benchmark("calculateBlobTxFee - capped blob fee", () =>
    FeeMarket.calculateBlobTxFee({
      ...testBlobTxParams,
      maxFeePerBlobGas: 3_000_000n,
      blobBaseFee: 5_000_000n,
    }),
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

console.log("\n--- Transaction Inclusion Checks ---");
results.push(
  benchmark("canIncludeTx - normal tx", () => FeeMarket.canIncludeTx(testTxParams)),
);
results.push(
  benchmark("canIncludeTx - blob tx", () =>
    FeeMarket.canIncludeTx(testBlobTxParams),
  ),
);
results.push(
  benchmark("canIncludeTx - insufficient fee", () =>
    FeeMarket.canIncludeTx({
      maxFeePerGas: 500_000_000n,
      maxPriorityFeePerGas: 100_000_000n,
      baseFee: 800_000_000n,
    }),
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

// ============================================================================
// State Operation Benchmarks
// ============================================================================

console.log("\n");
console.log("================================================================================");
console.log("FEE MARKET BENCHMARKS - STATE OPERATIONS");
console.log("================================================================================\n");

console.log("--- State Transitions ---");
results.push(
  benchmark("nextState - standard form", () => FeeMarket.nextState(testState)),
);
results.push(
  benchmark("nextState - convenience form", () =>
    FeeMarket.State.next.call(testState),
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

console.log("\n--- State Queries ---");
results.push(
  benchmark("State.getBlobBaseFee", () =>
    FeeMarket.State.getBlobBaseFee.call(testState),
  ),
);
results.push(
  benchmark("State.getGasTarget", () =>
    FeeMarket.State.getGasTarget.call(testState),
  ),
);
results.push(
  benchmark("State.isAboveGasTarget", () =>
    FeeMarket.State.isAboveGasTarget.call(testState),
  ),
);
results.push(
  benchmark("State.isAboveBlobGasTarget", () =>
    FeeMarket.State.isAboveBlobGasTarget.call(testState),
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

console.log("\n--- Fee Projections ---");
results.push(
  benchmark("projectBaseFees - 10 blocks", () =>
    FeeMarket.projectBaseFees(testState, 10, 25_000_000n, 262144n),
  ),
);
results.push(
  benchmark("projectBaseFees - 50 blocks", () =>
    FeeMarket.projectBaseFees(testState, 50, 25_000_000n, 262144n),
  ),
);
results.push(
  benchmark("projectBaseFees - 100 blocks", () =>
    FeeMarket.projectBaseFees(testState, 100, 25_000_000n, 262144n),
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

// ============================================================================
// Validation Benchmarks
// ============================================================================

console.log("\n");
console.log("================================================================================");
console.log("FEE MARKET BENCHMARKS - VALIDATION");
console.log("================================================================================\n");

console.log("--- Transaction Parameter Validation ---");
results.push(
  benchmark("validateTxFeeParams - valid tx", () =>
    FeeMarket.validateTxFeeParams(testTxParams),
  ),
);
results.push(
  benchmark("validateTxFeeParams - valid blob tx", () =>
    FeeMarket.validateTxFeeParams(testBlobTxParams),
  ),
);
results.push(
  benchmark("validateTxFeeParams - invalid tx", () =>
    FeeMarket.validateTxFeeParams({
      maxFeePerGas: -1n,
      maxPriorityFeePerGas: -1n,
      baseFee: -1n,
    }),
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

console.log("\n--- State Validation ---");
results.push(
  benchmark("validateState - valid", () => FeeMarket.validateState(testState)),
);
results.push(
  benchmark("validateState - invalid", () =>
    FeeMarket.validateState({
      gasUsed: -1n,
      gasLimit: 0n,
      baseFee: 1n,
      excessBlobGas: -1n,
      blobGasUsed: -1n,
    }),
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
// Utility Benchmarks
// ============================================================================

console.log("\n");
console.log("================================================================================");
console.log("FEE MARKET BENCHMARKS - UTILITIES");
console.log("================================================================================\n");

console.log("--- Unit Conversions ---");
results.push(
  benchmark("weiToGwei", () => FeeMarket.weiToGwei(1_234_567_890n)),
);
results.push(benchmark("gweiToWei", () => FeeMarket.gweiToWei(1.23456789)));

console.log(
  results
    .slice(-2)
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
console.log("BENCHMARK SUMMARY");
console.log("================================================================================\n");

console.log(`Total benchmarks run: ${results.length}`);

// Find fastest and slowest
const sorted = [...results].sort((a, b) => b.opsPerSec - a.opsPerSec);
console.log(`\nFastest: ${sorted[0]!.name}`);
console.log(
  `  ${sorted[0]!.opsPerSec.toFixed(0)} ops/sec (${sorted[0]!.avgTimeMs.toFixed(6)} ms/op)`,
);
console.log(`\nSlowest: ${sorted[sorted.length - 1]!.name}`);
console.log(
  `  ${sorted[sorted.length - 1]!.opsPerSec.toFixed(0)} ops/sec (${sorted[sorted.length - 1]!.avgTimeMs.toFixed(6)} ms/op)`,
);

// Calculate statistics by category
const categories = {
  baseFee: results.filter((r) => r.name.includes("calculateBaseFee")),
  blobFee: results.filter(
    (r) =>
      r.name.includes("calculateBlobBaseFee") ||
      r.name.includes("calculateExcessBlobGas"),
  ),
  txFee: results.filter(
    (r) => r.name.includes("calculateTxFee") || r.name.includes("canIncludeTx"),
  ),
  state: results.filter((r) => r.name.includes("State") || r.name.includes("nextState")),
  validation: results.filter((r) => r.name.includes("validate")),
  utilities: results.filter(
    (r) => r.name.includes("weiToGwei") || r.name.includes("gweiToWei"),
  ),
};

console.log("\n--- Performance by Category ---");
for (const [category, items] of Object.entries(categories)) {
  if (items.length > 0) {
    const avgOps = items.reduce((sum, r) => sum + r.opsPerSec, 0) / items.length;
    console.log(`  ${category}: ${avgOps.toFixed(0)} ops/sec (avg)`);
  }
}

console.log("\n");

// Export results for analysis
if (typeof Bun !== "undefined") {
  const resultsFile =
    "/Users/williamcory/primitives/src/primitives/fee-market-bench-results.json";
  await Bun.write(resultsFile, JSON.stringify(results, null, 2));
  console.log(`Results saved to: ${resultsFile}\n`);
}
