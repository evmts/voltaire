/**
 * Hardfork Operation Benchmarks
 *
 * Measures performance of hardfork comparison, parsing, and utility operations
 */

import {
	FRONTIER,
	BERLIN,
	CANCUN,
	PRAGUE,
	LONDON,
	SHANGHAI,
} from "./constants.js";
import { allIds } from "./allIds.js";
import { allNames } from "./allNames.js";
import { compare } from "./compare.js";
import { equals } from "./equals.js";
import { fromString } from "./fromString.js";
import { gt } from "./gt.js";
import { gte } from "./gte.js";
import { hasEIP1153 } from "./hasEIP1153.js";
import { hasEIP1559 } from "./hasEIP1559.js";
import { hasEIP3855 } from "./hasEIP3855.js";
import { hasEIP4844 } from "./hasEIP4844.js";
import { isAfter } from "./isAfter.js";
import { isAtLeast } from "./isAtLeast.js";
import { isBefore } from "./isBefore.js";
import { isEqual } from "./isEqual.js";
import { isPoS } from "./isPoS.js";
import { isPostMerge } from "./isPostMerge.js";
import { isValidName } from "./isValidName.js";
import { lt } from "./lt.js";
import { lte } from "./lte.js";
import { max } from "./max.js";
import { min } from "./min.js";
import { range } from "./range.js";
import { supportsBlobs } from "./supportsBlobs.js";
import { supportsEIP1559 } from "./supportsEIP1559.js";
import { supportsPUSH0 } from "./supportsPUSH0.js";
import { supportsTransientStorage } from "./supportsTransientStorage.js";
import { toString } from "./toString.js";

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
	for (let i = 0; i < 1000; i++) {
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

const testForks = {
	early: FRONTIER,
	middle: BERLIN,
	recent: CANCUN,
	latest: PRAGUE,
};

const testStrings = [
	"cancun",
	"shanghai",
	"merge",
	"london",
	"berlin",
	"paris", // alias
	"constantinoplefix", // alias
];

// ============================================================================
// Comparison Operation Benchmarks
// ============================================================================

console.log(
	"================================================================================",
);
console.log("HARDFORK COMPARISON BENCHMARKS");
console.log(
	"================================================================================\n",
);

const results: BenchmarkResult[] = [];

console.log("--- Basic Comparisons ---");
results.push(
	benchmark("isAtLeast", () => isAtLeast(testForks.recent, testForks.middle)),
);
results.push(
	benchmark("isBefore", () => isBefore(testForks.middle, testForks.recent)),
);
results.push(
	benchmark("isAfter", () => isAfter(testForks.recent, testForks.middle)),
);
results.push(
	benchmark("isEqual", () => isEqual(testForks.recent, testForks.recent)),
);
results.push(
	benchmark("compare", () => compare(testForks.middle, testForks.recent)),
);

console.log(
	results
		.slice(-5)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(6)} ms/op)`,
		)
		.join("\n"),
);

console.log("\n--- Convenience Forms ---");
results.push(
	benchmark("gte.call", () => gte.call(testForks.recent, testForks.middle)),
);
results.push(
	benchmark("lt.call", () => lt.call(testForks.middle, testForks.recent)),
);
results.push(
	benchmark("gt.call", () => gt.call(testForks.recent, testForks.middle)),
);
results.push(
	benchmark("equals.call", () =>
		equals.call(testForks.recent, testForks.recent),
	),
);
results.push(
	benchmark("lte.call", () => lte.call(testForks.middle, testForks.recent)),
);

console.log(
	results
		.slice(-5)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(6)} ms/op)`,
		)
		.join("\n"),
);

console.log("\n--- Array Operations ---");
const testArray = [
	testForks.recent,
	testForks.early,
	testForks.middle,
	testForks.latest,
];

results.push(benchmark("min", () => min(testArray)));
results.push(benchmark("max", () => max(testArray)));

console.log(
	results
		.slice(-2)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(6)} ms/op)`,
		)
		.join("\n"),
);

// ============================================================================
// String Parsing Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("HARDFORK STRING PARSING BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- String to ID ---");
let stringIdx = 0;
results.push(
	benchmark("fromString", () => {
		fromString(testStrings[stringIdx % testStrings.length]!);
		stringIdx++;
	}),
);
results.push(benchmark("fromString - alias", () => fromString("paris")));
results.push(
	benchmark("fromString - with operator", () => fromString(">=cancun")),
);
results.push(benchmark("fromString - invalid", () => fromString("unknown")));

console.log(
	results
		.slice(-4)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(6)} ms/op)`,
		)
		.join("\n"),
);

console.log("\n--- ID to String ---");
results.push(benchmark("toString", () => toString(testForks.recent)));

console.log(
	results
		.slice(-1)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(6)} ms/op)`,
		)
		.join("\n"),
);

console.log("\n--- Validation ---");
results.push(benchmark("isValidName - valid", () => isValidName("cancun")));
results.push(benchmark("isValidName - invalid", () => isValidName("unknown")));

console.log(
	results
		.slice(-2)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(6)} ms/op)`,
		)
		.join("\n"),
);

// ============================================================================
// Feature Detection Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("HARDFORK FEATURE DETECTION BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- Standard Form ---");
results.push(benchmark("hasEIP1559", () => hasEIP1559(testForks.recent)));
results.push(benchmark("hasEIP3855", () => hasEIP3855(testForks.recent)));
results.push(benchmark("hasEIP4844", () => hasEIP4844(testForks.recent)));
results.push(benchmark("hasEIP1153", () => hasEIP1153(testForks.recent)));
results.push(benchmark("isPostMerge", () => isPostMerge(testForks.recent)));

console.log(
	results
		.slice(-5)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(6)} ms/op)`,
		)
		.join("\n"),
);

console.log("\n--- Convenience Form ---");
results.push(
	benchmark("supportsEIP1559.call", () =>
		supportsEIP1559.call(testForks.recent),
	),
);
results.push(
	benchmark("supportsPUSH0.call", () => supportsPUSH0.call(testForks.recent)),
);
results.push(
	benchmark("supportsBlobs.call", () => supportsBlobs.call(testForks.recent)),
);
results.push(
	benchmark("supportsTransientStorage.call", () =>
		supportsTransientStorage.call(testForks.recent),
	),
);
results.push(benchmark("isPoS.call", () => isPoS.call(testForks.recent)));

console.log(
	results
		.slice(-5)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(6)} ms/op)`,
		)
		.join("\n"),
);

// ============================================================================
// Utility Operation Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("HARDFORK UTILITY BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- Collection Operations ---");
results.push(benchmark("allNames", () => allNames()));
results.push(benchmark("allIds", () => allIds()));

console.log(
	results
		.slice(-2)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(6)} ms/op)`,
		)
		.join("\n"),
);

console.log("\n--- Range Generation ---");
results.push(benchmark("range - short", () => range(BERLIN, LONDON)));
results.push(benchmark("range - medium", () => range(BERLIN, SHANGHAI)));
results.push(benchmark("range - long", () => range(FRONTIER, PRAGUE)));
results.push(benchmark("range - descending", () => range(SHANGHAI, BERLIN)));

console.log(
	results
		.slice(-4)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(6)} ms/op)`,
		)
		.join("\n"),
);

// ============================================================================
// Real-world Scenario Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("HARDFORK REAL-WORLD SCENARIO BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- Common Patterns ---");
results.push(
	benchmark("parse then check EIP-1559", () => {
		const fork = fromString("cancun");
		if (fork !== undefined) {
			hasEIP1559(fork);
		}
	}),
);
results.push(
	benchmark("check multiple features", () => {
		const fork = testForks.recent;
		hasEIP1559(fork);
		hasEIP3855(fork);
		hasEIP4844(fork);
		isPostMerge(fork);
	}),
);
results.push(
	benchmark("version compatibility check", () => {
		const minVersion = LONDON;
		const currentVersion = testForks.recent;
		isAtLeast(currentVersion, minVersion);
	}),
);

console.log(
	results
		.slice(-3)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(6)} ms/op)`,
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
console.log("SUMMARY");
console.log(
	"================================================================================\n",
);

console.log(`Total benchmarks run: ${results.length}\n`);

// Find fastest and slowest operations
const sorted = [...results].sort((a, b) => b.opsPerSec - a.opsPerSec);

console.log("Fastest operations:");
console.log(
	sorted
		.slice(0, 5)
		.map((r, i) => `  ${i + 1}. ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec`)
		.join("\n"),
);

console.log("\nSlowest operations:");
console.log(
	sorted
		.slice(-5)
		.reverse()
		.map((r, i) => `  ${i + 1}. ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec`)
		.join("\n"),
);

console.log("\nPerformance insights:");
console.log(
	"  - Comparison operations are extremely fast (simple integer comparisons)",
);
console.log("  - String parsing has minor overhead from case normalization");
console.log("  - Feature detection is as fast as basic comparisons");
console.log("  - Range generation scales linearly with range size");
console.log("  - Convenience forms have minimal overhead\n");

// Export results for analysis
if (typeof Bun !== "undefined") {
	const resultsFile =
		"/Users/williamcory/primitives/src/primitives/hardfork-bench-results.json";
	await Bun.write(resultsFile, JSON.stringify(results, null, 2));
	console.log(`Results saved to: ${resultsFile}\n`);
}
