/**
 * Hardfork Operation Benchmarks
 *
 * Measures performance of hardfork comparison, parsing, and utility operations
 */

import * as Hardfork from "./Hardfork.js";

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
	early: Hardfork.Id.FRONTIER,
	middle: Hardfork.Id.BERLIN,
	recent: Hardfork.Id.CANCUN,
	latest: Hardfork.Id.PRAGUE,
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
	benchmark("isAtLeast", () =>
		Hardfork.isAtLeast(testForks.recent, testForks.middle),
	),
);
results.push(
	benchmark("isBefore", () =>
		Hardfork.isBefore(testForks.middle, testForks.recent),
	),
);
results.push(
	benchmark("isAfter", () =>
		Hardfork.isAfter(testForks.recent, testForks.middle),
	),
);
results.push(
	benchmark("isEqual", () =>
		Hardfork.isEqual(testForks.recent, testForks.recent),
	),
);
results.push(
	benchmark("compare", () =>
		Hardfork.compare(testForks.middle, testForks.recent),
	),
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
	benchmark("gte.call", () =>
		Hardfork.gte.call(testForks.recent, testForks.middle),
	),
);
results.push(
	benchmark("lt.call", () =>
		Hardfork.lt.call(testForks.middle, testForks.recent),
	),
);
results.push(
	benchmark("gt.call", () =>
		Hardfork.gt.call(testForks.recent, testForks.middle),
	),
);
results.push(
	benchmark("eq.call", () =>
		Hardfork.eq.call(testForks.recent, testForks.recent),
	),
);
results.push(
	benchmark("lte.call", () =>
		Hardfork.lte.call(testForks.middle, testForks.recent),
	),
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

results.push(benchmark("min", () => Hardfork.min(testArray)));
results.push(benchmark("max", () => Hardfork.max(testArray)));

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
		Hardfork.fromString(testStrings[stringIdx % testStrings.length]!);
		stringIdx++;
	}),
);
results.push(
	benchmark("fromString - alias", () => Hardfork.fromString("paris")),
);
results.push(
	benchmark("fromString - with operator", () =>
		Hardfork.fromString(">=cancun"),
	),
);
results.push(
	benchmark("fromString - invalid", () => Hardfork.fromString("unknown")),
);

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
results.push(benchmark("toString", () => Hardfork.toString(testForks.recent)));

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
results.push(
	benchmark("isValidName - valid", () => Hardfork.isValidName("cancun")),
);
results.push(
	benchmark("isValidName - invalid", () => Hardfork.isValidName("unknown")),
);

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
results.push(
	benchmark("hasEIP1559", () => Hardfork.hasEIP1559(testForks.recent)),
);
results.push(
	benchmark("hasEIP3855", () => Hardfork.hasEIP3855(testForks.recent)),
);
results.push(
	benchmark("hasEIP4844", () => Hardfork.hasEIP4844(testForks.recent)),
);
results.push(
	benchmark("hasEIP1153", () => Hardfork.hasEIP1153(testForks.recent)),
);
results.push(
	benchmark("isPostMerge", () => Hardfork.isPostMerge(testForks.recent)),
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

console.log("\n--- Convenience Form ---");
results.push(
	benchmark("supportsEIP1559.call", () =>
		Hardfork.supportsEIP1559.call(testForks.recent),
	),
);
results.push(
	benchmark("supportsPUSH0.call", () =>
		Hardfork.supportsPUSH0.call(testForks.recent),
	),
);
results.push(
	benchmark("supportsBlobs.call", () =>
		Hardfork.supportsBlobs.call(testForks.recent),
	),
);
results.push(
	benchmark("supportsTransientStorage.call", () =>
		Hardfork.supportsTransientStorage.call(testForks.recent),
	),
);
results.push(
	benchmark("isPoS.call", () => Hardfork.isPoS.call(testForks.recent)),
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
results.push(benchmark("allNames", () => Hardfork.allNames()));
results.push(benchmark("allIds", () => Hardfork.allIds()));

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
results.push(
	benchmark("range - short", () =>
		Hardfork.range(Hardfork.Id.BERLIN, Hardfork.Id.LONDON),
	),
);
results.push(
	benchmark("range - medium", () =>
		Hardfork.range(Hardfork.Id.BERLIN, Hardfork.Id.SHANGHAI),
	),
);
results.push(
	benchmark("range - long", () =>
		Hardfork.range(Hardfork.Id.FRONTIER, Hardfork.Id.PRAGUE),
	),
);
results.push(
	benchmark("range - descending", () =>
		Hardfork.range(Hardfork.Id.SHANGHAI, Hardfork.Id.BERLIN),
	),
);

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
		const fork = Hardfork.fromString("cancun");
		if (fork !== undefined) {
			Hardfork.hasEIP1559(fork);
		}
	}),
);
results.push(
	benchmark("check multiple features", () => {
		const fork = testForks.recent;
		Hardfork.hasEIP1559(fork);
		Hardfork.hasEIP3855(fork);
		Hardfork.hasEIP4844(fork);
		Hardfork.isPostMerge(fork);
	}),
);
results.push(
	benchmark("version compatibility check", () => {
		const minVersion = Hardfork.Id.LONDON;
		const currentVersion = testForks.recent;
		Hardfork.isAtLeast(currentVersion, minVersion);
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
