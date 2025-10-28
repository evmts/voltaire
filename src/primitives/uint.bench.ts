/**
 * Uint256 Performance Benchmarks
 *
 * Measures performance of all Uint256 operations
 */

import { Uint } from "./uint.js";

// Benchmark runner
interface BenchmarkResult {
  name: string;
  opsPerSec: number;
  avgTimeMs: number;
  iterations: number;
}

function benchmark(name: string, fn: () => void, duration = 2000): BenchmarkResult {
  // Warmup
  for (let i = 0; i < 1000; i++) {
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

const smallValue = Uint.from(100);
const mediumValue = Uint.from(1n << 64n);
const largeValue = Uint.from(1n << 128n);
const maxValue = Uint.MAX;

const testHex = "0x1234567890abcdef";
const testBytes = new Uint8Array([0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef]);
const testBigInt = 123456789n;

const results: BenchmarkResult[] = [];

// ============================================================================
// Construction Benchmarks
// ============================================================================

console.log("================================================================================");
console.log("UINT256 CONSTRUCTION BENCHMARKS");
console.log("================================================================================\n");

console.log("--- from() ---");
results.push(benchmark("from(bigint)", () => Uint.from(100n)));
results.push(benchmark("from(number)", () => Uint.from(255)));
results.push(benchmark("from(string decimal)", () => Uint.from("1000")));
results.push(benchmark("from(string hex)", () => Uint.from("0xff")));

console.log(
  results
    .slice(-4)
    .map(
      (r) => `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

console.log("\n--- fromHex() ---");
results.push(benchmark("fromHex - short", () => Uint.fromHex.call("0xff")));
results.push(benchmark("fromHex - medium", () => Uint.fromHex.call(testHex)));
results.push(
  benchmark("fromHex - long", () =>
    Uint.fromHex.call("0x" + "f".repeat(64)),
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

console.log("\n--- fromBigInt() ---");
results.push(benchmark("fromBigInt", () => Uint.fromBigInt.call(testBigInt)));

console.log(
  results
    .slice(-1)
    .map(
      (r) => `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

console.log("\n--- fromNumber() ---");
results.push(benchmark("fromNumber", () => Uint.fromNumber.call(255)));

console.log(
  results
    .slice(-1)
    .map(
      (r) => `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

console.log("\n--- fromBytes() ---");
results.push(benchmark("fromBytes - 8 bytes", () => Uint.fromBytes.call(testBytes)));
results.push(
  benchmark("fromBytes - 32 bytes", () => Uint.fromBytes.call(new Uint8Array(32))),
);

console.log(
  results
    .slice(-2)
    .map(
      (r) => `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

console.log("\n--- tryFrom() ---");
results.push(benchmark("tryFrom - valid", () => Uint.tryFrom(100n)));
results.push(benchmark("tryFrom - invalid", () => Uint.tryFrom(-1n)));

console.log(
  results
    .slice(-2)
    .map(
      (r) => `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

// ============================================================================
// Conversion Benchmarks
// ============================================================================

console.log("\n");
console.log("================================================================================");
console.log("UINT256 CONVERSION BENCHMARKS");
console.log("================================================================================\n");

console.log("--- toHex() ---");
results.push(benchmark("toHex - small (padded)", () => Uint.toHex.call(smallValue)));
results.push(benchmark("toHex - small (unpadded)", () => Uint.toHex.call(smallValue, false)));
results.push(benchmark("toHex - large (padded)", () => Uint.toHex.call(largeValue)));

console.log(
  results
    .slice(-3)
    .map(
      (r) => `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

console.log("\n--- toBigInt() ---");
results.push(benchmark("toBigInt", () => Uint.toBigInt.call(smallValue)));

console.log(
  results
    .slice(-1)
    .map(
      (r) => `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

console.log("\n--- toNumber() ---");
results.push(benchmark("toNumber", () => Uint.toNumber.call(smallValue)));

console.log(
  results
    .slice(-1)
    .map(
      (r) => `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

console.log("\n--- toBytes() ---");
results.push(benchmark("toBytes - small", () => Uint.toBytes.call(smallValue)));
results.push(benchmark("toBytes - large", () => Uint.toBytes.call(largeValue)));
results.push(benchmark("toBytes - MAX", () => Uint.toBytes.call(maxValue)));

console.log(
  results
    .slice(-3)
    .map(
      (r) => `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

console.log("\n--- toString() ---");
results.push(benchmark("toString - decimal", () => Uint.toString.call(smallValue, 10)));
results.push(benchmark("toString - hex", () => Uint.toString.call(smallValue, 16)));
results.push(benchmark("toString - binary", () => Uint.toString.call(smallValue, 2)));

console.log(
  results
    .slice(-3)
    .map(
      (r) => `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

// ============================================================================
// Arithmetic Benchmarks
// ============================================================================

console.log("\n");
console.log("================================================================================");
console.log("UINT256 ARITHMETIC BENCHMARKS");
console.log("================================================================================\n");

console.log("--- Addition ---");
results.push(benchmark("plus - small", () => Uint.plus.call(smallValue, smallValue)));
results.push(benchmark("plus - medium", () => Uint.plus.call(mediumValue, mediumValue)));
results.push(benchmark("plus - large", () => Uint.plus.call(largeValue, largeValue)));
results.push(benchmark("plus - wrap", () => Uint.plus.call(maxValue, Uint.ONE)));

console.log(
  results
    .slice(-4)
    .map(
      (r) => `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

console.log("\n--- Subtraction ---");
results.push(benchmark("minus - small", () => Uint.minus.call(smallValue, Uint.from(50))));
results.push(benchmark("minus - medium", () => Uint.minus.call(mediumValue, smallValue)));
results.push(benchmark("minus - large", () => Uint.minus.call(largeValue, mediumValue)));
results.push(benchmark("minus - wrap", () => Uint.minus.call(Uint.ZERO, Uint.ONE)));

console.log(
  results
    .slice(-4)
    .map(
      (r) => `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

console.log("\n--- Multiplication ---");
results.push(benchmark("times - small", () => Uint.times.call(smallValue, Uint.from(2))));
results.push(benchmark("times - medium", () => Uint.times.call(mediumValue, Uint.from(2))));
results.push(benchmark("times - large", () => Uint.times.call(largeValue, Uint.from(2))));
results.push(benchmark("times - wrap", () => Uint.times.call(maxValue, Uint.from(2))));

console.log(
  results
    .slice(-4)
    .map(
      (r) => `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

console.log("\n--- Division ---");
results.push(benchmark("dividedBy - small", () => Uint.dividedBy.call(smallValue, Uint.from(10))));
results.push(benchmark("dividedBy - medium", () => Uint.dividedBy.call(mediumValue, Uint.from(100))));
results.push(benchmark("dividedBy - large", () => Uint.dividedBy.call(largeValue, Uint.from(1000))));

console.log(
  results
    .slice(-3)
    .map(
      (r) => `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

console.log("\n--- Modulo ---");
results.push(benchmark("modulo - small", () => Uint.modulo.call(smallValue, Uint.from(30))));
results.push(benchmark("modulo - medium", () => Uint.modulo.call(mediumValue, Uint.from(1000))));

console.log(
  results
    .slice(-2)
    .map(
      (r) => `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

console.log("\n--- Exponentiation ---");
results.push(benchmark("toPower - 2^8", () => Uint.toPower.call(Uint.from(2), Uint.from(8))));
results.push(benchmark("toPower - 10^5", () => Uint.toPower.call(Uint.from(10), Uint.from(5))));

console.log(
  results
    .slice(-2)
    .map(
      (r) => `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

// ============================================================================
// Bitwise Benchmarks
// ============================================================================

console.log("\n");
console.log("================================================================================");
console.log("UINT256 BITWISE BENCHMARKS");
console.log("================================================================================\n");

const a = Uint.from(0xff);
const b = Uint.from(0x0f);

console.log("--- Bitwise Operations ---");
results.push(benchmark("bitwiseAnd", () => Uint.bitwiseAnd.call(a, b)));
results.push(benchmark("bitwiseOr", () => Uint.bitwiseOr.call(a, b)));
results.push(benchmark("bitwiseXor", () => Uint.bitwiseXor.call(a, b)));
results.push(benchmark("bitwiseNot", () => Uint.bitwiseNot.call(a)));

console.log(
  results
    .slice(-4)
    .map(
      (r) => `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

console.log("\n--- Shift Operations ---");
results.push(benchmark("shiftLeft - 1 bit", () => Uint.shiftLeft.call(smallValue, Uint.ONE)));
results.push(benchmark("shiftLeft - 8 bits", () => Uint.shiftLeft.call(smallValue, Uint.from(8))));
results.push(benchmark("shiftRight - 1 bit", () => Uint.shiftRight.call(smallValue, Uint.ONE)));
results.push(benchmark("shiftRight - 8 bits", () => Uint.shiftRight.call(smallValue, Uint.from(8))));

console.log(
  results
    .slice(-4)
    .map(
      (r) => `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

// ============================================================================
// Comparison Benchmarks
// ============================================================================

console.log("\n");
console.log("================================================================================");
console.log("UINT256 COMPARISON BENCHMARKS");
console.log("================================================================================\n");

const v1 = Uint.from(100);
const v2 = Uint.from(200);

console.log("--- Comparison Operations ---");
results.push(benchmark("equals", () => Uint.equals.call(v1, v1)));
results.push(benchmark("notEquals", () => Uint.notEquals.call(v1, v2)));
results.push(benchmark("lessThan", () => Uint.lessThan.call(v1, v2)));
results.push(benchmark("lessThanOrEqual", () => Uint.lessThanOrEqual.call(v1, v2)));
results.push(benchmark("greaterThan", () => Uint.greaterThan.call(v2, v1)));
results.push(benchmark("greaterThanOrEqual", () => Uint.greaterThanOrEqual.call(v2, v1)));
results.push(benchmark("isZero", () => Uint.isZero.call(v1)));

console.log(
  results
    .slice(-7)
    .map(
      (r) => `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

console.log("\n--- Min/Max Operations ---");
results.push(benchmark("minimum", () => Uint.minimum.call(v1, v2)));
results.push(benchmark("maximum", () => Uint.maximum.call(v1, v2)));

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
console.log("UINT256 UTILITY BENCHMARKS");
console.log("================================================================================\n");

console.log("--- Validation ---");
results.push(benchmark("isValid - valid", () => Uint.isValid(100n)));
results.push(benchmark("isValid - invalid", () => Uint.isValid(-1n)));

console.log(
  results
    .slice(-2)
    .map(
      (r) => `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

console.log("\n--- Bit Operations ---");
results.push(benchmark("bitLength - small", () => Uint.bitLength.call(smallValue)));
results.push(benchmark("bitLength - large", () => Uint.bitLength.call(largeValue)));
results.push(benchmark("leadingZeros - small", () => Uint.leadingZeros.call(smallValue)));
results.push(benchmark("leadingZeros - large", () => Uint.leadingZeros.call(largeValue)));
results.push(benchmark("popCount - small", () => Uint.popCount.call(Uint.from(0xff))));
results.push(benchmark("popCount - large", () => Uint.popCount.call(largeValue)));

console.log(
  results
    .slice(-6)
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

// Find fastest and slowest
const sorted = [...results].sort((a, b) => b.opsPerSec - a.opsPerSec);
console.log(`\nFastest: ${sorted[0].name} (${sorted[0].opsPerSec.toFixed(0)} ops/sec)`);
console.log(`Slowest: ${sorted[sorted.length - 1].name} (${sorted[sorted.length - 1].opsPerSec.toFixed(0)} ops/sec)`);

// Export results for analysis
if (typeof Bun !== "undefined") {
  const resultsFile = "/Users/williamcory/primitives/src/primitives/uint-results.json";
  await Bun.write(resultsFile, JSON.stringify(results, null, 2));
  console.log(`\nResults saved to: ${resultsFile}\n`);
}
