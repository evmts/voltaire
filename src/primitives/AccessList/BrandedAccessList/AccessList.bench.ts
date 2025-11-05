/**
 * AccessList Performance Benchmarks
 *
 * Measures performance of access list operations
 */

import type { BrandedAddress } from "../Address/BrandedAddress/BrandedAddress.js";
import type { BrandedHash } from "../Hash/BrandedHash/index.js";
import type { Item } from "./BrandedAccessList.js";
import { from } from "./from.js";
import { gasCost } from "./gasCost.js";
import { gasSavings } from "./gasSavings.js";
import { hasSavings } from "./hasSavings.js";
import { includesAddress } from "./includesAddress.js";
import { includesStorageKey } from "./includesStorageKey.js";
import { keysFor } from "./keysFor.js";
import { deduplicate } from "./deduplicate.js";
import { withAddress } from "./withAddress.js";
import { withStorageKey } from "./withStorageKey.js";
import { merge } from "./merge.js";
import { assertValid } from "./assertValid.js";
import { isItem } from "./isItem.js";
import { is } from "./is.js";
import { addressCount } from "./addressCount.js";
import { storageKeyCount } from "./storageKeyCount.js";
import { isEmpty } from "./isEmpty.js";
import { create } from "./create.js";

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

// Helper to create test addresses
function createAddress(byte: number): BrandedAddress {
	const addr = new Uint8Array(20);
	addr.fill(byte);
	return addr as BrandedAddress;
}

// Helper to create test storage keys
function createStorageKey(byte: number): BrandedHash {
	const key = new Uint8Array(32);
	key.fill(byte);
	return key as BrandedHash;
}

const addr1 = createAddress(1);
const addr2 = createAddress(2);
// const _addr3 = createAddress(3);

const key1 = createStorageKey(10);
const key2 = createStorageKey(20);
const key3 = createStorageKey(30);

// Small list
const smallListArray: Item[] = [
	{ address: addr1, storageKeys: [key1] },
	{ address: addr2, storageKeys: [key2, key3] },
];
const smallList = from(smallListArray);

// Medium list
const mediumListArray: Item[] = [];
for (let i = 0; i < 10; i++) {
	mediumListArray.push({
		address: createAddress(i),
		storageKeys: [createStorageKey(i * 2), createStorageKey(i * 2 + 1)],
	});
}
const mediumList = from(mediumListArray);

// Large list
const largeListArray: Item[] = [];
for (let i = 0; i < 100; i++) {
	largeListArray.push({
		address: createAddress(i % 50),
		storageKeys: [createStorageKey(i * 2), createStorageKey(i * 2 + 1)],
	});
}
const largeList = from(largeListArray);

// List with duplicates
const duplicateListArray: Item[] = [
	{ address: addr1, storageKeys: [key1] },
	{ address: addr2, storageKeys: [key2] },
	{ address: addr1, storageKeys: [key2, key3] },
	{ address: addr2, storageKeys: [key3] },
];
const duplicateList = from(duplicateListArray);

// ============================================================================
// Gas Cost Benchmarks
// ============================================================================

console.log(
	"================================================================================",
);
console.log("ACCESSLIST GAS COST BENCHMARKS");
console.log(
	"================================================================================\n",
);

const results: BenchmarkResult[] = [];

console.log("--- Gas Cost Calculations ---");
results.push(
	benchmark("gasCost - small list", () => gasCost(smallList)),
);
results.push(
	benchmark("gasCost - medium list", () => gasCost(mediumList)),
);
results.push(
	benchmark("gasCost - large list", () => gasCost(largeList)),
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

console.log("\n--- Gas Savings Calculations ---");
results.push(
	benchmark("gasSavings - small list", () => gasSavings(smallList)),
);
results.push(
	benchmark("gasSavings - medium list", () =>
		gasSavings(mediumList),
	),
);
results.push(
	benchmark("gasSavings - large list", () => gasSavings(largeList)),
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

console.log("\n--- Has Savings Check ---");
results.push(
	benchmark("hasSavings - small list", () => hasSavings(smallList)),
);
results.push(
	benchmark("hasSavings - medium list", () =>
		hasSavings(mediumList),
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
// Query Operation Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("ACCESSLIST QUERY OPERATION BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- Address Lookup ---");
results.push(
	benchmark("includesAddress - small list (found)", () =>
		includesAddress(smallList, addr1),
	),
);
results.push(
	benchmark("includesAddress - medium list (found)", () =>
		includesAddress(mediumList, mediumList[5]!.address),
	),
);
results.push(
	benchmark("includesAddress - large list (not found)", () =>
		includesAddress(largeList, createAddress(200)),
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

console.log("\n--- Storage Key Lookup ---");
results.push(
	benchmark("includesStorageKey - found", () =>
		includesStorageKey(smallList, addr1, key1),
	),
);
results.push(
	benchmark("includesStorageKey - not found", () =>
		includesStorageKey(smallList, addr1, createStorageKey(99)),
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

console.log("\n--- Keys Retrieval ---");
results.push(
	benchmark("keysFor - found", () => keysFor(smallList, addr1)),
);
results.push(
	benchmark("keysFor - not found", () =>
		keysFor(smallList, createAddress(99)),
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
// Transformation Operation Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("ACCESSLIST TRANSFORMATION BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- Deduplication ---");
results.push(
	benchmark("deduplicate - no duplicates", () =>
		deduplicate(smallList),
	),
);
results.push(
	benchmark("deduplicate - with duplicates", () =>
		deduplicate(duplicateList),
	),
);
results.push(
	benchmark("deduplicate - large list", () =>
		deduplicate(largeList),
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

console.log("\n--- Adding Addresses ---");
results.push(
	benchmark("withAddress - new address", () =>
		withAddress(smallList, createAddress(99)),
	),
);
results.push(
	benchmark("withAddress - existing address", () =>
		withAddress(smallList, addr1),
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

console.log("\n--- Adding Storage Keys ---");
results.push(
	benchmark("withStorageKey - new key to existing address", () =>
		withStorageKey(smallList, addr1, createStorageKey(99)),
	),
);
results.push(
	benchmark("withStorageKey - duplicate key", () =>
		withStorageKey(smallList, addr1, key1),
	),
);
results.push(
	benchmark("withStorageKey - new address with key", () =>
		withStorageKey(smallList, createAddress(99), key1),
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

console.log("\n--- Merging ---");
results.push(
	benchmark("merge - two small lists", () =>
		merge(smallList, smallList),
	),
);
results.push(
	benchmark("merge - three lists", () =>
		merge(smallList, mediumList, duplicateList),
	),
);
results.push(
	benchmark("merge - large lists", () =>
		merge(largeList, largeList),
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
// Validation Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("ACCESSLIST VALIDATION BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- Validation ---");
results.push(
	benchmark("assertValid - small list", () =>
		assertValid(smallList),
	),
);
results.push(
	benchmark("assertValid - medium list", () =>
		assertValid(mediumList),
	),
);
results.push(
	benchmark("assertValid - large list", () =>
		assertValid(largeList),
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
// Type Guard Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("ACCESSLIST TYPE GUARD BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- Type Guards ---");
results.push(
	benchmark("isItem - valid", () =>
		isItem({ address: addr1, storageKeys: [key1] }),
	),
);
results.push(
	benchmark("isItem - invalid", () => isItem({ invalid: true })),
);
results.push(benchmark("is - valid", () => is(smallList)));
results.push(benchmark("is - invalid", () => is({ invalid: true })));

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
console.log("ACCESSLIST UTILITY BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- Counting Operations ---");
results.push(
	benchmark("addressCount - small list", () =>
		addressCount(smallList),
	),
);
results.push(
	benchmark("storageKeyCount - small list", () =>
		storageKeyCount(smallList),
	),
);
results.push(
	benchmark("addressCount - large list", () =>
		addressCount(largeList),
	),
);
results.push(
	benchmark("storageKeyCount - large list", () =>
		storageKeyCount(largeList),
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

console.log("\n--- Other Utilities ---");
results.push(benchmark("isEmpty - empty", () => isEmpty([])));
results.push(
	benchmark("isEmpty - non-empty", () => isEmpty(smallList)),
);
results.push(benchmark("create", () => create()));

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
		"/Users/williamcory/primitives/src/primitives/access-list-results.json";
	await Bun.write(resultsFile, JSON.stringify(results, null, 2));
	console.log(`\nResults saved to: ${resultsFile}\n`);
}
