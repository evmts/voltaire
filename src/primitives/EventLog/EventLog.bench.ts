/**
 * EventLog Benchmarks
 *
 * Measures performance of event log operations
 */

import type { BrandedAddress } from "../Address/BrandedAddress/BrandedAddress.js";
import type { BrandedHash } from "../Hash/index.js";
import { clone } from "./clone.js";
import { copy } from "./copy.js";
import { create } from "./create.js";
import { filterLogs } from "./filterLogs.js";
import { getIndexed } from "./getIndexed.js";
import { getIndexedTopics } from "./getIndexedTopics.js";
import { getSignature } from "./getSignature.js";
import { getTopic0 } from "./getTopic0.js";
import { isRemoved } from "./isRemoved.js";
import { matchesAddress } from "./matchesAddress.js";
import { matchesFilter } from "./matchesFilter.js";
import { matchesTopics } from "./matchesTopics.js";
import { sortLogs } from "./sortLogs.js";
import { wasRemoved } from "./wasRemoved.js";

// ============================================================================
// Benchmark Infrastructure
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

const addr1 =
	"0x0000000000000000000000000000000000000001" as unknown as BrandedAddress;
const addr2 =
	"0x0000000000000000000000000000000000000002" as unknown as BrandedAddress;
const addr3 =
	"0x0000000000000000000000000000000000000003" as unknown as BrandedAddress;

const topic0 =
	"0x0000000000000000000000000000000000000000000000000000000000000010" as unknown as BrandedHash;
const topic1 =
	"0x0000000000000000000000000000000000000000000000000000000000000011" as unknown as BrandedHash;
const topic2 =
	"0x0000000000000000000000000000000000000000000000000000000000000012" as unknown as BrandedHash;
const topic3 =
	"0x0000000000000000000000000000000000000000000000000000000000000013" as unknown as BrandedHash;

const blockHash =
	"0x0000000000000000000000000000000000000000000000000000000000000100" as unknown as BrandedHash;
const txHash =
	"0x0000000000000000000000000000000000000000000000000000000000000200" as unknown as BrandedHash;

const testLog = create({
	address: addr1,
	topics: [topic0, topic1, topic2],
	data: new Uint8Array([1, 2, 3, 4, 5]),
	blockNumber: 100n,
	transactionHash: txHash,
	transactionIndex: 5,
	blockHash: blockHash,
	logIndex: 10,
	removed: false,
});

// Create large log dataset for filtering benchmarks
const largeLogs = Array.from({ length: 1000 }, (_, i) => {
	const blockNum = 1000n + BigInt(i);
	return create({
		address: i % 3 === 0 ? addr1 : i % 3 === 1 ? addr2 : addr3,
		topics: [
			i % 2 === 0 ? topic0 : topic1,
			i % 3 === 0 ? topic1 : topic2,
			topic3,
		],
		data: new Uint8Array([i % 256]),
		blockNumber: blockNum,
		logIndex: i % 50,
	});
});

// ============================================================================
// Log Creation Benchmarks
// ============================================================================

console.log(
	"================================================================================",
);
console.log("EVENT LOG CREATION BENCHMARKS");
console.log(
	"================================================================================\n",
);

const results: BenchmarkResult[] = [];

console.log("--- Log Creation ---");
results.push(
	benchmark("EventLog.create - minimal", () =>
		create({
			address: addr1,
			topics: [topic0],
			data: new Uint8Array([1, 2, 3]),
		}),
	),
);
results.push(
	benchmark("EventLog.create - full", () =>
		create({
			address: addr1,
			topics: [topic0, topic1, topic2],
			data: new Uint8Array([1, 2, 3, 4, 5]),
			blockNumber: 100n,
			transactionHash: txHash,
			transactionIndex: 5,
			blockHash: blockHash,
			logIndex: 10,
			removed: false,
		}),
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
// Topic Operations Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("TOPIC OPERATIONS BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- Topic Access ---");
results.push(
	benchmark("EventLog.getTopic0", () => getTopic0(testLog)),
);
results.push(
	benchmark("EventLog.getSignature (this:)", () =>
		getSignature(testLog),
	),
);
results.push(
	benchmark("EventLog.getIndexedTopics", () =>
		getIndexedTopics(testLog),
	),
);
results.push(
	benchmark("EventLog.getIndexed (this:)", () =>
		getIndexed(testLog),
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
// Topic Matching Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("TOPIC MATCHING BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- Topic Matching ---");
results.push(
	benchmark("matchesTopics - exact match", () =>
		matchesTopics(testLog, [topic0, topic1, topic2]),
	),
);
results.push(
	benchmark("matchesTopics - with null wildcard", () =>
		matchesTopics(testLog, [topic0, null, topic2]),
	),
);
results.push(
	benchmark("matchesTopics - with array (OR logic)", () =>
		matchesTopics(testLog, [[topic0, topic1], topic1, topic2]),
	),
);
results.push(
	benchmark("matchesTopics - no match", () =>
		matchesTopics(testLog, [topic1, topic1, topic2]),
	),
);
results.push(
	benchmark("matches (this:) - with wildcard", () =>
		matchesTopics(testLog, [topic0, null, topic2]),
	),
);

console.log(
	results
		.slice(-5)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
		)
		.join("\n"),
);

// ============================================================================
// Address Matching Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("ADDRESS MATCHING BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- Address Matching ---");
results.push(
	benchmark("matchesAddress - single match", () =>
		matchesAddress(testLog, addr1),
	),
);
results.push(
	benchmark("matchesAddress - single no match", () =>
		matchesAddress(testLog, addr2),
	),
);
results.push(
	benchmark("matchesAddress - array match", () =>
		matchesAddress(testLog, [addr1, addr2, addr3]),
	),
);
results.push(
	benchmark("matchesAddress - array no match", () =>
		matchesAddress(testLog, [addr2, addr3]),
	),
);
results.push(
	benchmark("matchesAddr (this:) - single", () =>
		matchesAddress(testLog, addr1),
	),
);

console.log(
	results
		.slice(-5)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
		)
		.join("\n"),
);

// ============================================================================
// Complete Filter Matching Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("COMPLETE FILTER MATCHING BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- Filter Matching ---");
results.push(
	benchmark("matchesFilter - address only", () =>
		matchesFilter(testLog, { address: addr1 }),
	),
);
results.push(
	benchmark("matchesFilter - topics only", () =>
		matchesFilter(testLog, { topics: [topic0, null, topic2] }),
	),
);
results.push(
	benchmark("matchesFilter - address + topics", () =>
		matchesFilter(testLog, {
			address: addr1,
			topics: [topic0, null, topic2],
		}),
	),
);
results.push(
	benchmark("matchesFilter - with block range", () =>
		matchesFilter(testLog, {
			address: addr1,
			topics: [topic0],
			fromBlock: 50n,
			toBlock: 150n,
		}),
	),
);
results.push(
	benchmark("matchesFilter - complete filter", () =>
		matchesFilter(testLog, {
			address: [addr1, addr2],
			topics: [topic0, null, topic2],
			fromBlock: 50n,
			toBlock: 150n,
			blockHash: blockHash,
		}),
	),
);
results.push(
	benchmark("matchesAll (this:) - complete", () =>
		matchesFilter(testLog, {
			address: addr1,
			topics: [topic0, null, topic2],
			fromBlock: 50n,
			toBlock: 150n,
		}),
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

// ============================================================================
// Log Array Filtering Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("LOG ARRAY FILTERING BENCHMARKS (1000 logs)");
console.log(
	"================================================================================\n",
);

console.log("--- Array Filtering ---");
results.push(
	benchmark(
		"filterLogs - by address",
		() => filterLogs(largeLogs, { address: addr1 }),
		1000,
	),
);
results.push(
	benchmark(
		"filterLogs - by topics",
		() => filterLogs(largeLogs, { topics: [topic0] }),
		1000,
	),
);
results.push(
	benchmark(
		"filterLogs - address + topics",
		() =>
			filterLogs(largeLogs, {
				address: addr1,
				topics: [topic0],
			}),
		1000,
	),
);
results.push(
	benchmark(
		"filterLogs - block range",
		() =>
			filterLogs(largeLogs, {
				fromBlock: 1100n,
				toBlock: 1200n,
			}),
		1000,
	),
);
results.push(
	benchmark(
		"filterLogs - complex filter",
		() =>
			filterLogs(largeLogs, {
				address: [addr1, addr2],
				topics: [[topic0, topic1], null, topic3],
				fromBlock: 1100n,
				toBlock: 1500n,
			}),
		1000,
	),
);
results.push(
	benchmark(
		"filter (this:) - complex",
		() =>
			filterLogs(largeLogs, {
				address: [addr1, addr2],
				topics: [topic0],
			}),
		1000,
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

// ============================================================================
// Sorting Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("SORTING BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- Log Sorting ---");
results.push(
	benchmark(
		"sortLogs - 10 logs",
		() => sortLogs(largeLogs.slice(0, 10)),
		2000,
	),
);
results.push(
	benchmark(
		"sortLogs - 100 logs",
		() => sortLogs(largeLogs.slice(0, 100)),
		1000,
	),
);
results.push(
	benchmark("sortLogs - 1000 logs", () => sortLogs(largeLogs), 500),
);
results.push(
	benchmark(
		"sort (this:) - 100 logs",
		() => sortLogs(largeLogs.slice(0, 100)),
		1000,
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
// Removal Check Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("REMOVAL CHECK BENCHMARKS");
console.log(
	"================================================================================\n",
);

const removedLog = create({
	address: addr1,
	topics: [topic0],
	data: new Uint8Array([]),
	removed: true,
});

console.log("--- Removal Checks ---");
results.push(
	benchmark("isRemoved - removed log", () => isRemoved(removedLog)),
);
results.push(
	benchmark("isRemoved - active log", () => isRemoved(testLog)),
);
results.push(
	benchmark("wasRemoved (this:) - removed", () =>
		wasRemoved(removedLog),
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
// Clone Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("CLONE BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- Cloning ---");
results.push(
	benchmark("clone - minimal log", () =>
		clone(
			create({
				address: addr1,
				topics: [topic0],
				data: new Uint8Array([1, 2, 3]),
			}),
		),
	),
);
results.push(benchmark("clone - full log", () => clone(testLog)));
results.push(
	benchmark("copy (this:) - full log", () => copy(testLog)),
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
// Summary
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("BENCHMARK SUMMARY");
console.log(
	"================================================================================\n",
);

console.log(`Total benchmarks run: ${results.length}`);
console.log(
	`Total iterations: ${results.reduce((sum, r) => sum + r.iterations, 0).toLocaleString()}`,
);

// Find fastest and slowest operations
const fastest = results.reduce((prev, curr) =>
	curr.opsPerSec > prev.opsPerSec ? curr : prev,
);
const slowest = results.reduce((prev, curr) =>
	curr.opsPerSec < prev.opsPerSec ? curr : prev,
);

console.log(`\nFastest: ${fastest.name}`);
console.log(
	`  ${fastest.opsPerSec.toFixed(0)} ops/sec (${fastest.avgTimeMs.toFixed(6)} ms/op)`,
);

console.log(`\nSlowest: ${slowest.name}`);
console.log(
	`  ${slowest.opsPerSec.toFixed(0)} ops/sec (${slowest.avgTimeMs.toFixed(6)} ms/op)`,
);

console.log(
	`\nPerformance ratio: ${(fastest.opsPerSec / slowest.opsPerSec).toFixed(2)}x\n`,
);

// Export results for analysis
if (typeof Bun !== "undefined") {
	const resultsFile =
		"/Users/williamcory/primitives/src/primitives/event-log-results.json";
	await Bun.write(resultsFile, JSON.stringify(results, null, 2));
	console.log(`Results saved to: ${resultsFile}\n`);
}
