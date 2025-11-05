/**
 * Hash Performance Benchmarks
 *
 * Measures performance of Hash operations including creation,
 * conversion, comparison, validation, hashing, and utilities
 */

import { assert } from "./assert.js";
import { clone } from "./clone.js";
import { ZERO } from "./constants.js";
import { equals } from "./equals.js";
import { format } from "./format.js";
import { fromBytes } from "./fromBytes.js";
import { fromHex } from "./fromHex.js";
import { isHash } from "./isHash.js";
import { isValidHex } from "./isValidHex.js";
import { isZero } from "./isZero.js";
import { keccak256 } from "./keccak256.js";
import { keccak256Hex } from "./keccak256Hex.js";
import { keccak256String } from "./keccak256String.js";
import { random } from "./random.js";
import { slice } from "./slice.js";
import { toBytes } from "./toBytes.js";
import { toHex } from "./toHex.js";
import { toString } from "./toString.js";

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

const validHex =
	"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
const validHexNoPrefix =
	"1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
const invalidHexShort = "0x1234";
const invalidHexBadChars =
	"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdeg";

const validBytes = new Uint8Array(32);
validBytes.fill(1);

const invalidBytes = new Uint8Array(16);

const hash1 = fromHex(validHex);
const hash2 = fromHex(validHex);
const hash3 = fromBytes(validBytes);
const zeroHash = ZERO;

// Different data sizes for keccak256 benchmarks
const emptyData = new Uint8Array(0);
const smallData = new Uint8Array(32);
smallData.fill(1);
const mediumData = new Uint8Array(1024); // 1KB
mediumData.fill(2);
const largeData = new Uint8Array(10240); // 10KB
largeData.fill(3);

// ============================================================================
// Creation Benchmarks
// ============================================================================

console.log(
	"================================================================================",
);
console.log("HASH CREATION BENCHMARKS");
console.log(
	"================================================================================\n",
);

const results: BenchmarkResult[] = [];

console.log("--- fromHex ---");
results.push(
	benchmark("fromHex - with 0x prefix", () => fromHex(validHex)),
);
results.push(
	benchmark("fromHex - without prefix", () => fromHex(validHexNoPrefix)),
);
results.push(
	benchmark("fromHex - invalid length", () => {
		try {
			fromHex(invalidHexShort);
		} catch {
			// Expected
		}
	}),
);
results.push(
	benchmark("fromHex - invalid chars", () => {
		try {
			fromHex(invalidHexBadChars);
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

console.log("\n--- fromBytes ---");
results.push(benchmark("fromBytes - valid", () => fromBytes(validBytes)));
results.push(
	benchmark("fromBytes - invalid length", () => {
		try {
			fromBytes(invalidBytes);
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

console.log("\n--- from ---");
results.push(benchmark("from - alias for fromHex", () => fromHex(validHex)));

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
// Conversion Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("HASH CONVERSION BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- toHex ---");
results.push(benchmark("toHex", () => toHex(hash1)));

console.log(
	results
		.slice(-1)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
		)
		.join("\n"),
);

console.log("\n--- toBytes ---");
results.push(benchmark("toBytes", () => toBytes(hash1)));

console.log(
	results
		.slice(-1)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
		)
		.join("\n"),
);

console.log("\n--- toString ---");
results.push(benchmark("toString", () => toString(hash1)));

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
// Comparison Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("HASH COMPARISON BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- equals ---");
results.push(benchmark("equals - same value", () => equals(hash1, hash2)));
results.push(
	benchmark("equals - different value", () => equals(hash1, hash3)),
);
results.push(
	benchmark("equals - zero hash", () => equals(zeroHash, ZERO)),
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

console.log("\n--- isZero ---");
results.push(benchmark("isZero - zero hash", () => isZero(zeroHash)));
results.push(benchmark("isZero - non-zero hash", () => isZero(hash1)));

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
// Validation Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("HASH VALIDATION BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- isHash ---");
results.push(benchmark("isHash - valid", () => isHash(hash1)));
results.push(
	benchmark("isHash - invalid (string)", () => isHash(validHex)),
);
results.push(
	benchmark("isHash - invalid (wrong length)", () => isHash(invalidBytes)),
);
results.push(benchmark("isHash - invalid (null)", () => isHash(null)));

console.log(
	results
		.slice(-4)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
		)
		.join("\n"),
);

console.log("\n--- isValidHex ---");
results.push(
	benchmark("isValidHex - valid with prefix", () => isValidHex(validHex)),
);
results.push(
	benchmark("isValidHex - valid without prefix", () =>
		isValidHex(validHexNoPrefix),
	),
);
results.push(
	benchmark("isValidHex - invalid length", () =>
		isValidHex(invalidHexShort),
	),
);
results.push(
	benchmark("isValidHex - invalid chars", () =>
		isValidHex(invalidHexBadChars),
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

console.log("\n--- assert ---");
results.push(benchmark("assert - valid", () => assert(hash1)));
results.push(
	benchmark("assert - invalid", () => {
		try {
			assert(validHex);
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
// Hashing Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("HASH KECCAK256 BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- keccak256 - different data sizes ---");
results.push(
	benchmark("keccak256 - empty data", () => keccak256(emptyData)),
);
results.push(
	benchmark("keccak256 - small (32 bytes)", () => keccak256(smallData)),
);
results.push(
	benchmark("keccak256 - medium (1KB)", () => keccak256(mediumData)),
);
results.push(
	benchmark("keccak256 - large (10KB)", () => keccak256(largeData)),
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

console.log("\n--- keccak256String ---");
results.push(
	benchmark("keccak256String - empty", () => keccak256String("")),
);
results.push(
	benchmark("keccak256String - short", () => keccak256String("hello")),
);
results.push(
	benchmark("keccak256String - long", () =>
		keccak256String("a".repeat(1000)),
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

console.log("\n--- keccak256Hex ---");
results.push(
	benchmark("keccak256Hex - short", () => keccak256Hex("0x1234")),
);
results.push(
	benchmark("keccak256Hex - hash", () => keccak256Hex(validHex)),
);
results.push(
	benchmark("keccak256Hex - invalid", () => {
		try {
			keccak256Hex("0x123");
		} catch {
			// Expected
		}
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

// ============================================================================
// Utility Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("HASH UTILITY BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- random ---");
results.push(benchmark("random", () => random()));

console.log(
	results
		.slice(-1)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
		)
		.join("\n"),
);

console.log("\n--- clone ---");
results.push(benchmark("clone", () => clone(hash1)));

console.log(
	results
		.slice(-1)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
		)
		.join("\n"),
);

console.log("\n--- slice ---");
results.push(benchmark("slice - first 4 bytes", () => slice(hash1, 0, 4)));
results.push(
	benchmark("slice - last 4 bytes", () => slice(hash1, 28, 32)),
);
results.push(benchmark("slice - middle", () => slice(hash1, 10, 20)));

console.log(
	results
		.slice(-3)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
		)
		.join("\n"),
);

console.log("\n--- format ---");
results.push(benchmark("format - default", () => format(hash1)));
results.push(
	benchmark("format - custom lengths", () => format(hash1, 10, 8)),
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

// Group by operation type
console.log("\n--- Operation Categories ---");
const categories = {
	Creation: results.filter((r) => r.name.includes("from")),
	Conversion: results.filter(
		(r) =>
			r.name.includes("toHex") ||
			r.name.includes("toBytes") ||
			r.name.includes("toString"),
	),
	Comparison: results.filter(
		(r) => r.name.includes("equals") || r.name.includes("isZero"),
	),
	Validation: results.filter(
		(r) =>
			r.name.includes("isHash") ||
			r.name.includes("isValidHex") ||
			r.name.includes("assert"),
	),
	Hashing: results.filter((r) => r.name.includes("keccak256")),
	Utility: results.filter(
		(r) =>
			r.name.includes("random") ||
			r.name.includes("clone") ||
			r.name.includes("slice") ||
			r.name.includes("format"),
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
		"/Users/williamcory/primitives/src/primitives/hash-results.json";
	await Bun.write(resultsFile, JSON.stringify(results, null, 2));
	console.log(`\nResults saved to: ${resultsFile}\n`);
}
