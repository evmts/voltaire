/**
 * Uint256 Performance Benchmarks
 *
 * Measures performance of all Uint256 operations
 */

import * as Uint from "../Uint/index.js";

// Benchmark runner
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
const testBytes = new Uint8Array([
	0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef,
]);
const testBigInt = 123456789n;

const results: BenchmarkResult[] = [];

// ============================================================================
// Construction Benchmarks
// ============================================================================

console.log(
	"================================================================================",
);
console.log("UINT256 CONSTRUCTION BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- from() ---");
results.push(benchmark("from(bigint)", () => Uint.from(100n)));
results.push(benchmark("from(number)", () => Uint.from(255)));
results.push(benchmark("from(string decimal)", () => Uint.from("1000")));
results.push(benchmark("from(string hex)", () => Uint.from("0xff")));

console.log(
	results
		.slice(-4)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
		)
		.join("\n"),
);

console.log("\n--- fromHex() ---");
results.push(benchmark("fromHex - short", () => Uint.fromHex("0xff")));
results.push(benchmark("fromHex - medium", () => Uint.fromHex(testHex)));
results.push(
	benchmark("fromHex - long", () => Uint.fromHex("0x" + "f".repeat(64))),
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

console.log("\n--- fromBigInt() ---");
results.push(benchmark("fromBigInt", () => Uint.fromBigInt(testBigInt)));

console.log(
	results
		.slice(-1)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
		)
		.join("\n"),
);

console.log("\n--- fromNumber() ---");
results.push(benchmark("fromNumber", () => Uint.fromNumber(255)));

console.log(
	results
		.slice(-1)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
		)
		.join("\n"),
);

console.log("\n--- fromBytes() ---");
results.push(benchmark("fromBytes - 8 bytes", () => Uint.fromBytes(testBytes)));
results.push(
	benchmark("fromBytes - 32 bytes", () => Uint.fromBytes(new Uint8Array(32))),
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

console.log("\n--- tryFrom() ---");
results.push(benchmark("tryFrom - valid", () => Uint.tryFrom(100n)));
results.push(benchmark("tryFrom - invalid", () => Uint.tryFrom(-1n)));

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
// Conversion Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("UINT256 CONVERSION BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- toHex() ---");
results.push(benchmark("toHex - small (padded)", () => Uint.toHex(smallValue)));
results.push(
	benchmark("toHex - small (unpadded)", () => Uint.toHex(smallValue, false)),
);
results.push(benchmark("toHex - large (padded)", () => Uint.toHex(largeValue)));

console.log(
	results
		.slice(-3)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
		)
		.join("\n"),
);

console.log("\n--- toBigInt() ---");
results.push(benchmark("toBigInt", () => Uint.toBigInt(smallValue)));

console.log(
	results
		.slice(-1)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
		)
		.join("\n"),
);

console.log("\n--- toNumber() ---");
results.push(benchmark("toNumber", () => Uint.toNumber(smallValue)));

console.log(
	results
		.slice(-1)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
		)
		.join("\n"),
);

console.log("\n--- toBytes() ---");
results.push(benchmark("toBytes - small", () => Uint.toBytes(smallValue)));
results.push(benchmark("toBytes - large", () => Uint.toBytes(largeValue)));
results.push(benchmark("toBytes - MAX", () => Uint.toBytes(maxValue)));

console.log(
	results
		.slice(-3)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
		)
		.join("\n"),
);

console.log("\n--- toString() ---");
results.push(
	benchmark("toString - decimal", () => Uint.toString(smallValue, 10)),
);
results.push(benchmark("toString - hex", () => Uint.toString(smallValue, 16)));
results.push(
	benchmark("toString - binary", () => Uint.toString(smallValue, 2)),
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

// ============================================================================
// Arithmetic Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("UINT256 ARITHMETIC BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- Addition ---");
results.push(
	benchmark("plus - small", () => Uint.plus(smallValue, smallValue)),
);
results.push(
	benchmark("plus - medium", () => Uint.plus(mediumValue, mediumValue)),
);
results.push(
	benchmark("plus - large", () => Uint.plus(largeValue, largeValue)),
);
results.push(benchmark("plus - wrap", () => Uint.plus(maxValue, Uint.ONE)));

console.log(
	results
		.slice(-4)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
		)
		.join("\n"),
);

console.log("\n--- Subtraction ---");
results.push(
	benchmark("minus - small", () => Uint.minus(smallValue, Uint.from(50))),
);
results.push(
	benchmark("minus - medium", () => Uint.minus(mediumValue, smallValue)),
);
results.push(
	benchmark("minus - large", () => Uint.minus(largeValue, mediumValue)),
);
results.push(benchmark("minus - wrap", () => Uint.minus(Uint.ZERO, Uint.ONE)));

console.log(
	results
		.slice(-4)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
		)
		.join("\n"),
);

console.log("\n--- Multiplication ---");
results.push(
	benchmark("times - small", () => Uint.times(smallValue, Uint.from(2))),
);
results.push(
	benchmark("times - medium", () => Uint.times(mediumValue, Uint.from(2))),
);
results.push(
	benchmark("times - large", () => Uint.times(largeValue, Uint.from(2))),
);
results.push(
	benchmark("times - wrap", () => Uint.times(maxValue, Uint.from(2))),
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

console.log("\n--- Division ---");
results.push(
	benchmark("dividedBy - small", () =>
		Uint.dividedBy(smallValue, Uint.from(10)),
	),
);
results.push(
	benchmark("dividedBy - medium", () =>
		Uint.dividedBy(mediumValue, Uint.from(100)),
	),
);
results.push(
	benchmark("dividedBy - large", () =>
		Uint.dividedBy(largeValue, Uint.from(1000)),
	),
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

console.log("\n--- Modulo ---");
results.push(
	benchmark("modulo - small", () => Uint.modulo(smallValue, Uint.from(30))),
);
results.push(
	benchmark("modulo - medium", () => Uint.modulo(mediumValue, Uint.from(1000))),
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

console.log("\n--- Exponentiation ---");
results.push(
	benchmark("toPower - 2^8", () => Uint.toPower(Uint.from(2), Uint.from(8))),
);
results.push(
	benchmark("toPower - 10^5", () => Uint.toPower(Uint.from(10), Uint.from(5))),
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
// Bitwise Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("UINT256 BITWISE BENCHMARKS");
console.log(
	"================================================================================\n",
);

const a = Uint.from(0xff);
const b = Uint.from(0x0f);

console.log("--- Bitwise Operations ---");
results.push(benchmark("bitwiseAnd", () => Uint.bitwiseAnd(a, b)));
results.push(benchmark("bitwiseOr", () => Uint.bitwiseOr(a, b)));
results.push(benchmark("bitwiseXor", () => Uint.bitwiseXor(a, b)));
results.push(benchmark("bitwiseNot", () => Uint.bitwiseNot(a)));

console.log(
	results
		.slice(-4)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
		)
		.join("\n"),
);

console.log("\n--- Shift Operations ---");
results.push(
	benchmark("shiftLeft - 1 bit", () => Uint.shiftLeft(smallValue, Uint.ONE)),
);
results.push(
	benchmark("shiftLeft - 8 bits", () =>
		Uint.shiftLeft(smallValue, Uint.from(8)),
	),
);
results.push(
	benchmark("shiftRight - 1 bit", () => Uint.shiftRight(smallValue, Uint.ONE)),
);
results.push(
	benchmark("shiftRight - 8 bits", () =>
		Uint.shiftRight(smallValue, Uint.from(8)),
	),
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
// Comparison Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("UINT256 COMPARISON BENCHMARKS");
console.log(
	"================================================================================\n",
);

const v1 = Uint.from(100);
const v2 = Uint.from(200);

console.log("--- Comparison Operations ---");
results.push(benchmark("equals", () => Uint.equals(v1, v1)));
results.push(benchmark("notEquals", () => Uint.notEquals(v1, v2)));
results.push(benchmark("lessThan", () => Uint.lessThan(v1, v2)));
results.push(benchmark("lessThanOrEqual", () => Uint.lessThanOrEqual(v1, v2)));
results.push(benchmark("greaterThan", () => Uint.greaterThan(v2, v1)));
results.push(
	benchmark("greaterThanOrEqual", () => Uint.greaterThanOrEqual(v2, v1)),
);
results.push(benchmark("isZero", () => Uint.isZero(v1)));

console.log(
	results
		.slice(-7)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
		)
		.join("\n"),
);

console.log("\n--- Min/Max Operations ---");
results.push(benchmark("minimum", () => Uint.minimum(v1, v2)));
results.push(benchmark("maximum", () => Uint.maximum(v1, v2)));
results.push(benchmark("min - 3 values", () => Uint.min(v1, v2, v3)));
results.push(benchmark("max - 3 values", () => Uint.max(v1, v2, v3)));
results.push(
	benchmark("min - 10 values", () =>
		Uint.min(v1, v2, v3, v1, v2, v3, v1, v2, v3, v1),
	),
);
results.push(
	benchmark("max - 10 values", () =>
		Uint.max(v1, v2, v3, v1, v2, v3, v1, v2, v3, v1),
	),
);

console.log(
	results
		.slice(-6)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
		)
		.join("\n"),
);

console.log("\n--- Mathematical Operations ---");
const a = Uint.from(48n);
const b = Uint.from(18n);
const c = Uint.from(100n);
const d = Uint.from(150n);

results.push(benchmark("gcd - small values", () => Uint.gcd(a, b)));
results.push(
	benchmark("gcd - medium values", () => Uint.gcd(smallValue, mediumValue)),
);
results.push(
	benchmark("gcd - large values", () => Uint.gcd(mediumValue, largeValue)),
);
results.push(benchmark("lcm - small values", () => Uint.lcm(a, b)));
results.push(
	benchmark("lcm - medium values", () => Uint.lcm(smallValue, mediumValue)),
);
results.push(benchmark("sum - 2 values", () => Uint.sum(a, b)));
results.push(
	benchmark("sum - 5 values", () => Uint.sum(a, b, c, d, smallValue)),
);
results.push(
	benchmark("sum - 10 values", () => Uint.sum(a, b, c, d, a, b, c, d, a, b)),
);
results.push(benchmark("product - 2 values", () => Uint.product(a, b)));
results.push(
	benchmark("product - 5 values", () =>
		Uint.product(
			Uint.from(2n),
			Uint.from(3n),
			Uint.from(4n),
			Uint.from(5n),
			Uint.from(6n),
		),
	),
);

console.log(
	results
		.slice(-10)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
		)
		.join("\n"),
);

// ============================================================================
// Utility Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("UINT256 UTILITY BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- Validation ---");
results.push(benchmark("isValid - valid", () => Uint.isValid(100n)));
results.push(benchmark("isValid - invalid", () => Uint.isValid(-1n)));

console.log(
	results
		.slice(-2)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
		)
		.join("\n"),
);

console.log("\n--- Bit Operations ---");
results.push(benchmark("bitLength - small", () => Uint.bitLength(smallValue)));
results.push(benchmark("bitLength - large", () => Uint.bitLength(largeValue)));
results.push(
	benchmark("leadingZeros - small", () => Uint.leadingZeros(smallValue)),
);
results.push(
	benchmark("leadingZeros - large", () => Uint.leadingZeros(largeValue)),
);
results.push(
	benchmark("popCount - small", () => Uint.popCount(Uint.from(0xff))),
);
results.push(benchmark("popCount - large", () => Uint.popCount(largeValue)));

console.log(
	results
		.slice(-6)
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
console.log("Benchmarks complete!");
console.log(
	"================================================================================",
);
console.log(`\nTotal benchmarks run: ${results.length}`);

// Find fastest and slowest
const sorted = [...results].sort((a, b) => b.opsPerSec - a.opsPerSec);
console.log(
	`\nFastest: ${sorted[0]!.name} (${sorted[0]!.opsPerSec.toFixed(0)} ops/sec)`,
);
console.log(
	`Slowest: ${sorted[sorted.length - 1]!.name} (${sorted[sorted.length - 1]!.opsPerSec.toFixed(0)} ops/sec)`,
);

// Export results for analysis
if (typeof Bun !== "undefined") {
	const resultsFile =
		"/Users/williamcory/primitives/src/primitives/uint-results.json";
	await Bun.write(resultsFile, JSON.stringify(results, null, 2));
	console.log(`\nResults saved to: ${resultsFile}\n`);
}
