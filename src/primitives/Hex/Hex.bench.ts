/**
 * Hex Performance Benchmarks
 *
 * Measures performance of hex operations
 */

import { type BrandedHex, Hex } from "./index.js";

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

// Small data (4 bytes)
const smallHex: BrandedHex = "0x12345678" as BrandedHex;
const smallBytes = new Uint8Array([0x12, 0x34, 0x56, 0x78]);

// Medium data (32 bytes)
const mediumHex: BrandedHex =
	"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" as BrandedHex;
const mediumBytes = new Uint8Array(32);
for (let i = 0; i < 32; i++) mediumBytes[i] = i;

// Large data (256 bytes)
let largeHexStr = "0x";
for (let i = 0; i < 256; i++) {
	largeHexStr += (i % 256).toString(16).padStart(2, "0");
}
const largeHex: BrandedHex = largeHexStr as BrandedHex;
const largeBytes = new Uint8Array(256);
for (let i = 0; i < 256; i++) largeBytes[i] = i % 256;

// Test strings
const testString = "hello world";
const longString = "hello world ".repeat(10);

// Invalid hex strings
const invalidNoPrefix = "1234";
const invalidChars = "0xZZZZ";
// const invalidOdd = "0x123";

// ============================================================================
// Type Guard Benchmarks
// ============================================================================

console.log(
	"================================================================================",
);
console.log("HEX TYPE GUARD BENCHMARKS");
console.log(
	"================================================================================\n",
);

const results: BenchmarkResult[] = [];

console.log("--- Type Guards ---");
results.push(benchmark("isHex - valid small", () => Hex.isHex(smallHex)));
results.push(benchmark("isHex - valid large", () => Hex.isHex(largeHex)));
results.push(
	benchmark("isHex - invalid (no prefix)", () => Hex.isHex(invalidNoPrefix)),
);
results.push(
	benchmark("isHex - invalid (bad chars)", () => Hex.isHex(invalidChars)),
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

console.log("\n--- Sized Type Guards ---");
results.push(
	benchmark("isSized - correct size (4)", () => Hex.isSized(smallHex, 4)),
);
results.push(benchmark("isSized - wrong size", () => Hex.isSized(smallHex, 8)));
results.push(
	benchmark("isSized - large (256)", () => Hex.isSized(largeHex, 256)),
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
// Validation Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("HEX VALIDATION BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- Validate ---");
results.push(benchmark("validate - valid small", () => Hex.validate(smallHex)));
results.push(benchmark("validate - valid large", () => Hex.validate(largeHex)));
results.push(
	benchmark("validate - invalid (no prefix)", () => {
		try {
			Hex.validate(invalidNoPrefix);
		} catch {
			// Expected
		}
	}),
);
results.push(
	benchmark("validate - invalid (bad chars)", () => {
		try {
			Hex.validate(invalidChars);
		} catch {
			// Expected
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

console.log("\n--- Assert Size ---");
results.push(
	benchmark("assertSize - correct size", () => Hex.assertSize(smallHex, 4)),
);
results.push(
	benchmark("assertSize - wrong size", () => {
		try {
			Hex.assertSize(smallHex, 8);
		} catch {
			// Expected
		}
	}),
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
// Conversion Benchmarks - Bytes
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("HEX BYTES CONVERSION BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- From Bytes ---");
results.push(
	benchmark("fromBytes - small (4 bytes)", () => Hex.fromBytes(smallBytes)),
);
results.push(
	benchmark("fromBytes - medium (32 bytes)", () => Hex.fromBytes(mediumBytes)),
);
results.push(
	benchmark("fromBytes - large (256 bytes)", () => Hex.fromBytes(largeBytes)),
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

console.log("\n--- To Bytes ---");
results.push(
	benchmark("toBytes - small (4 bytes)", () => Hex.toBytes(smallHex)),
);
results.push(
	benchmark("toBytes - medium (32 bytes)", () => Hex.toBytes(mediumHex)),
);
results.push(
	benchmark("toBytes - large (256 bytes)", () => Hex.toBytes(largeHex)),
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
// Conversion Benchmarks - Number
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("HEX NUMBER CONVERSION BENCHMARKS");
console.log(
	"================================================================================\n",
);

const numSmall = 255;
const numMedium = 0x123456;
const numLarge = 0x7fffffff;

console.log("--- From Number ---");
results.push(
	benchmark("fromNumber - small (no padding)", () => Hex.fromNumber(numSmall)),
);
results.push(
	benchmark("fromNumber - small (padded)", () => Hex.fromNumber(numSmall, 4)),
);
results.push(benchmark("fromNumber - medium", () => Hex.fromNumber(numMedium)));
results.push(benchmark("fromNumber - large", () => Hex.fromNumber(numLarge)));

console.log(
	results
		.slice(-4)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
		)
		.join("\n"),
);

console.log("\n--- To Number ---");
const hexFromNum = Hex.fromNumber(0x123456);
results.push(
	benchmark("toNumber - small", () => Hex.toNumber("0xff" as BrandedHex)),
);
results.push(benchmark("toNumber - medium", () => Hex.toNumber(hexFromNum)));
results.push(benchmark("toNumber - large", () => Hex.toNumber(smallHex)));

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
// Conversion Benchmarks - BigInt
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("HEX BIGINT CONVERSION BENCHMARKS");
console.log(
	"================================================================================\n",
);

const bigSmall = 255n;
const bigMedium = 0x123456789abcdefn;
const bigLarge = BigInt(
	"0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
);

console.log("--- From BigInt ---");
results.push(benchmark("fromBigInt - small", () => Hex.fromBigInt(bigSmall)));
results.push(
	benchmark("fromBigInt - small (padded)", () => Hex.fromBigInt(bigSmall, 32)),
);
results.push(benchmark("fromBigInt - medium", () => Hex.fromBigInt(bigMedium)));
results.push(
	benchmark("fromBigInt - large (256 bits)", () => Hex.fromBigInt(bigLarge)),
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

console.log("\n--- To BigInt ---");
results.push(
	benchmark("toBigInt - small", () => Hex.toBigInt("0xff" as BrandedHex)),
);
results.push(benchmark("toBigInt - medium", () => Hex.toBigInt(mediumHex)));
results.push(benchmark("toBigInt - large", () => Hex.toBigInt(largeHex)));

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
// Conversion Benchmarks - String
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("HEX STRING CONVERSION BENCHMARKS");
console.log(
	"================================================================================\n",
);

const hexFromString = Hex.fromString(testString);
const hexFromLongString = Hex.fromString(longString);

console.log("--- From String ---");
results.push(benchmark("fromString - short", () => Hex.fromString(testString)));
results.push(benchmark("fromString - long", () => Hex.fromString(longString)));

console.log(
	results
		.slice(-2)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
		)
		.join("\n"),
);

console.log("\n--- To String ---");
results.push(benchmark("toString - short", () => Hex.toString(hexFromString)));
results.push(
	benchmark("toString - long", () => Hex.toString(hexFromLongString)),
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
// Conversion Benchmarks - Boolean
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("HEX BOOLEAN CONVERSION BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- From Boolean ---");
results.push(benchmark("fromBoolean - true", () => Hex.fromBoolean(true)));
results.push(benchmark("fromBoolean - false", () => Hex.fromBoolean(false)));

console.log(
	results
		.slice(-2)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
		)
		.join("\n"),
);

console.log("\n--- To Boolean ---");
results.push(
	benchmark("toBoolean - true (0x01)", () =>
		Hex.toBoolean("0x01" as BrandedHex),
	),
);
results.push(
	benchmark("toBoolean - false (0x00)", () =>
		Hex.toBoolean("0x00" as BrandedHex),
	),
);
results.push(
	benchmark("toBoolean - true (non-zero)", () =>
		Hex.toBoolean("0xff" as BrandedHex),
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

// ============================================================================
// Size Operation Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("HEX SIZE OPERATION BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- Size Calculation ---");
results.push(benchmark("size - small (4 bytes)", () => Hex.size(smallHex)));
results.push(benchmark("size - medium (32 bytes)", () => Hex.size(mediumHex)));
results.push(benchmark("size - large (256 bytes)", () => Hex.size(largeHex)));

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
// Manipulation Benchmarks - Concat
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("HEX MANIPULATION BENCHMARKS - CONCAT");
console.log(
	"================================================================================\n",
);

console.log("--- Concatenation ---");
results.push(
	benchmark("concat - two small", () => Hex.concat(smallHex, smallHex)),
);
results.push(
	benchmark("concat - three small", () =>
		Hex.concat(smallHex, smallHex, smallHex),
	),
);
results.push(
	benchmark("concat - two medium", () => Hex.concat(mediumHex, mediumHex)),
);
results.push(
	benchmark("concat - mixed sizes", () =>
		Hex.concat(smallHex, mediumHex, smallHex),
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
// Manipulation Benchmarks - Slice
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("HEX MANIPULATION BENCHMARKS - SLICE");
console.log(
	"================================================================================\n",
);

console.log("--- Slicing ---");
results.push(
	benchmark("slice - small (start only)", () => Hex.slice(smallHex, 1)),
);
results.push(
	benchmark("slice - small (start + end)", () => Hex.slice(smallHex, 1, 3)),
);
results.push(benchmark("slice - medium", () => Hex.slice(mediumHex, 8, 24)));
results.push(benchmark("slice - large", () => Hex.slice(largeHex, 64, 192)));

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
// Manipulation Benchmarks - Padding
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("HEX MANIPULATION BENCHMARKS - PADDING");
console.log(
	"================================================================================\n",
);

console.log("--- Left Padding ---");
results.push(benchmark("pad - small to medium", () => Hex.pad(smallHex, 32)));
results.push(benchmark("pad - small to large", () => Hex.pad(smallHex, 256)));
results.push(
	benchmark("pad - no-op (already sized)", () => Hex.pad(smallHex, 4)),
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

console.log("\n--- Right Padding ---");
results.push(
	benchmark("padRight - small to medium", () => Hex.padRight(smallHex, 32)),
);
results.push(
	benchmark("padRight - small to large", () => Hex.padRight(smallHex, 256)),
);
results.push(
	benchmark("padRight - no-op (already sized)", () =>
		Hex.padRight(smallHex, 4),
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

// ============================================================================
// Manipulation Benchmarks - Trim
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("HEX MANIPULATION BENCHMARKS - TRIM");
console.log(
	"================================================================================\n",
);

const paddedSmall = Hex.pad(smallHex, 32);
const paddedMedium = Hex.pad(mediumHex, 256);

console.log("--- Trimming ---");
results.push(benchmark("trim - no leading zeros", () => Hex.trim(smallHex)));
results.push(benchmark("trim - padded small", () => Hex.trim(paddedSmall)));
results.push(benchmark("trim - padded medium", () => Hex.trim(paddedMedium)));
results.push(benchmark("trim - all zeros", () => Hex.trim(Hex.zero(32))));

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
console.log("HEX COMPARISON BENCHMARKS");
console.log(
	"================================================================================\n",
);

const hexUpper: BrandedHex = "0xABCDEF" as BrandedHex;
const hexLower: BrandedHex = "0xabcdef" as BrandedHex;
const hexDifferent: BrandedHex = "0x123456" as BrandedHex;

console.log("--- Equality ---");
results.push(
	benchmark("equals - same (exact)", () => Hex.equals(smallHex, smallHex)),
);
results.push(
	benchmark("equals - same (case diff)", () => Hex.equals(hexUpper, hexLower)),
);
results.push(
	benchmark("equals - different", () => Hex.equals(hexUpper, hexDifferent)),
);
results.push(benchmark("equals - large", () => Hex.equals(largeHex, largeHex)));

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
// Bitwise Operation Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("HEX BITWISE OPERATION BENCHMARKS");
console.log(
	"================================================================================\n",
);

const xorA: BrandedHex = "0x12345678" as BrandedHex;
const xorB: BrandedHex = "0xabcdef01" as BrandedHex;
const xorMediumA = mediumHex;
const xorMediumB = Hex.random(32);

console.log("--- XOR Operations ---");
results.push(benchmark("xor - small (4 bytes)", () => Hex.xor(xorA, xorB)));
results.push(
	benchmark("xor - medium (32 bytes)", () => Hex.xor(xorMediumA, xorMediumB)),
);
results.push(
	benchmark("xor - large (256 bytes)", () =>
		Hex.xor(largeHex, Hex.random(256)),
	),
);
results.push(
	benchmark("xor - length mismatch", () => {
		try {
			Hex.xor(smallHex, mediumHex);
		} catch {
			// Expected
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
// Utility Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("HEX UTILITY BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- Random Generation ---");
results.push(benchmark("random - small (4 bytes)", () => Hex.random(4)));
results.push(benchmark("random - medium (32 bytes)", () => Hex.random(32)));
results.push(benchmark("random - large (256 bytes)", () => Hex.random(256)));

console.log(
	results
		.slice(-3)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
		)
		.join("\n"),
);

console.log("\n--- Zero Generation ---");
results.push(benchmark("zero - small (4 bytes)", () => Hex.zero(4)));
results.push(benchmark("zero - medium (32 bytes)", () => Hex.zero(32)));
results.push(benchmark("zero - large (256 bytes)", () => Hex.zero(256)));

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

// Find fastest and slowest operations
const sorted = [...results].sort((a, b) => b.opsPerSec - a.opsPerSec);
console.log(
	`\nFastest: ${sorted[0]!.name} - ${sorted[0]!.opsPerSec.toFixed(0)} ops/sec`,
);
console.log(
	`Slowest: ${sorted[sorted.length - 1]!.name} - ${sorted[sorted.length - 1]!.opsPerSec.toFixed(0)} ops/sec`,
);

// Export results for analysis
if (typeof Bun !== "undefined") {
	const resultsFile =
		"/Users/williamcory/primitives/src/primitives/hex-results.json";
	await Bun.write(resultsFile, JSON.stringify(results, null, 2));
	console.log(`\nResults saved to: ${resultsFile}\n`);
}
