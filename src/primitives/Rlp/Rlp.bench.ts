/**
 * RLP Encoding/Decoding Benchmarks
 *
 * Measures performance of RLP operations
 */

import type { BrandedRlp } from "./BrandedRlp.js";
import type { Encodable } from "./encode.js";
import { encode } from "./encode.js";
import { encodeBytes } from "./encodeBytes.js";
import { encodeList } from "./encodeList.js";
import { decode } from "./decode.js";
import { isData } from "./isData.js";
import { isBytesData } from "./isBytesData.js";
import { isListData } from "./isListData.js";
import { getEncodedLength } from "./getEncodedLength.js";
import { flatten } from "./flatten.js";
import { equals } from "./equals.js";
import { toJSON } from "./toJSON.js";
import { fromJSON } from "./fromJSON.js";
import * as Data from "./Data.js";
import type { Data as RlpData } from "./index.js";

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

const singleByte = new Uint8Array([0x42]);
const shortBytes = new Uint8Array([1, 2, 3, 4, 5]);
const mediumBytes = new Uint8Array(32).fill(0xff);
const longBytes = new Uint8Array(200).fill(0xaa);
const veryLongBytes = new Uint8Array(10000).fill(0xbb);

const emptyList: Encodable[] = [];
const shortList = [new Uint8Array([0x01]), new Uint8Array([0x02])];
const mediumList = Array.from({ length: 10 }, (_, i) => new Uint8Array([i]));
const longList = Array.from(
	{ length: 100 },
	(_, i) => new Uint8Array([i % 256]),
);

const nestedList = [
	new Uint8Array([0x01]),
	[new Uint8Array([0x02]), new Uint8Array([0x03])],
	[[new Uint8Array([0x04])]],
];

const deeplyNested = [[[[new Uint8Array([0x01]), new Uint8Array([0x02])]]]];

// Pre-encoded data for decoding benchmarks
const encodedSingleByte = encode(singleByte);
const encodedShortBytes = encode(shortBytes);
const encodedMediumBytes = encode(mediumBytes);
const encodedLongBytes = encode(longBytes);
const encodedVeryLongBytes = encode(veryLongBytes);

const encodedEmptyList = encode(emptyList);
const encodedShortList = encode(shortList);
const encodedMediumList = encode(mediumList);
const encodedLongList = encode(longList);
const encodedNestedList = encode(nestedList);
const encodedDeeplyNested = encode(deeplyNested);

// ============================================================================
// Encoding Benchmarks - Bytes
// ============================================================================

const results: BenchmarkResult[] = [];

console.log(
	"================================================================================",
);
console.log("RLP ENCODING BENCHMARKS - BYTES");
console.log(
	"================================================================================\n",
);

console.log("--- Byte Encoding ---");
results.push(
	benchmark("encode single byte (< 0x80)", () => encode(singleByte)),
);
results.push(
	benchmark("encode short bytes (5 bytes)", () => encode(shortBytes)),
);
results.push(
	benchmark("encode medium bytes (32 bytes)", () => encode(mediumBytes)),
);
results.push(
	benchmark("encode long bytes (200 bytes)", () => encode(longBytes)),
);
results.push(
	benchmark("encode very long bytes (10KB)", () => encode(veryLongBytes)),
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
// Encoding Benchmarks - Lists
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("RLP ENCODING BENCHMARKS - LISTS");
console.log(
	"================================================================================\n",
);

console.log("--- List Encoding ---");
results.push(benchmark("encode empty list", () => encode(emptyList)));
results.push(
	benchmark("encode short list (2 items)", () => encode(shortList)),
);
results.push(
	benchmark("encode medium list (10 items)", () => encode(mediumList)),
);
results.push(
	benchmark("encode long list (100 items)", () => encode(longList)),
);
results.push(
	benchmark("encode nested list (3 levels)", () => encode(nestedList)),
);
results.push(
	benchmark("encode deeply nested list (4+ levels)", () =>
		encode(deeplyNested),
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
// Decoding Benchmarks - Bytes
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("RLP DECODING BENCHMARKS - BYTES");
console.log(
	"================================================================================\n",
);

console.log("--- Byte Decoding ---");
results.push(
	benchmark("decode single byte (< 0x80)", () => decode(encodedSingleByte)),
);
results.push(
	benchmark("decode short bytes (5 bytes)", () =>
		decode(encodedShortBytes),
	),
);
results.push(
	benchmark("decode medium bytes (32 bytes)", () =>
		decode(encodedMediumBytes),
	),
);
results.push(
	benchmark("decode long bytes (200 bytes)", () =>
		decode(encodedLongBytes),
	),
);
results.push(
	benchmark("decode very long bytes (10KB)", () =>
		decode(encodedVeryLongBytes),
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
// Decoding Benchmarks - Lists
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("RLP DECODING BENCHMARKS - LISTS");
console.log(
	"================================================================================\n",
);

console.log("--- List Decoding ---");
results.push(
	benchmark("decode empty list", () => decode(encodedEmptyList)),
);
results.push(
	benchmark("decode short list (2 items)", () => decode(encodedShortList)),
);
results.push(
	benchmark("decode medium list (10 items)", () =>
		decode(encodedMediumList),
	),
);
results.push(
	benchmark("decode long list (100 items)", () => decode(encodedLongList)),
);
results.push(
	benchmark("decode nested list (3 levels)", () =>
		decode(encodedNestedList),
	),
);
results.push(
	benchmark("decode deeply nested list (4+ levels)", () =>
		decode(encodedDeeplyNested),
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
// Round-trip Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("RLP ROUND-TRIP BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- Round-trip Performance ---");
results.push(
	benchmark("round-trip single byte", () => {
		const encoded = encode(singleByte);
		decode(encoded);
	}),
);
results.push(
	benchmark("round-trip short bytes (5 bytes)", () => {
		const encoded = encode(shortBytes);
		decode(encoded);
	}),
);
results.push(
	benchmark("round-trip medium bytes (32 bytes)", () => {
		const encoded = encode(mediumBytes);
		decode(encoded);
	}),
);
results.push(
	benchmark("round-trip long bytes (200 bytes)", () => {
		const encoded = encode(longBytes);
		decode(encoded);
	}),
);
results.push(
	benchmark("round-trip short list", () => {
		const encoded = encode(shortList);
		decode(encoded);
	}),
);
results.push(
	benchmark("round-trip nested list", () => {
		const encoded = encode(nestedList);
		decode(encoded);
	}),
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
// Utility Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("RLP UTILITY BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- Utility Functions ---");
results.push(
	benchmark("getEncodedLength - bytes", () =>
		getEncodedLength.call(mediumBytes),
	),
);
results.push(
	benchmark("getEncodedLength - list", () =>
		getEncodedLength.call(mediumList),
	),
);

const flattenData: RlpData = {
	type: "list",
	value: [
		{ type: "bytes", value: new Uint8Array([1]) },
		{
			type: "list",
			value: [
				{ type: "bytes", value: new Uint8Array([2]) },
				{ type: "bytes", value: new Uint8Array([3]) },
			],
		},
	],
};

results.push(
	benchmark("flatten nested list", () => flatten.call(flattenData)),
);

const data1: RlpData = { type: "bytes", value: new Uint8Array([1, 2, 3]) };
const data2: RlpData = { type: "bytes", value: new Uint8Array([1, 2, 3]) };

results.push(
	benchmark("equals - bytes Data", () => equals.call(data1, data2)),
);

const listData1: RlpData = {
	type: "list",
	value: [
		{ type: "bytes", value: new Uint8Array([1]) },
		{ type: "bytes", value: new Uint8Array([2]) },
	],
};
const listData2: RlpData = {
	type: "list",
	value: [
		{ type: "bytes", value: new Uint8Array([1]) },
		{ type: "bytes", value: new Uint8Array([2]) },
	],
};

results.push(
	benchmark("equals - list Data", () => equals.call(listData1, listData2)),
);

results.push(benchmark("toJSON - bytes", () => toJSON.call(data1)));
results.push(benchmark("toJSON - list", () => toJSON.call(listData1)));

const jsonData = { type: "bytes", value: [1, 2, 3] };
results.push(benchmark("fromJSON - bytes", () => fromJSON.call(jsonData)));

console.log(
	results
		.slice(-8)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
		)
		.join("\n"),
);

// ============================================================================
// Data Namespace Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("RLP DATA NAMESPACE BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- Data Operations ---");
results.push(
	benchmark("Data.fromBytes", () => Data.fromBytes.call(mediumBytes)),
);
results.push(
	benchmark("Data.fromList", () =>
		Data.fromList.call([
			{ type: "bytes", value: new Uint8Array([1]) },
			{ type: "bytes", value: new Uint8Array([2]) },
		]),
	),
);
results.push(
	benchmark("Data.encodeData", () => Data.encodeData.call(data1)),
);
results.push(benchmark("Data.toBytes", () => Data.toBytes.call(data1)));
results.push(benchmark("Data.toList", () => Data.toList.call(listData1)));

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
// Type Guard Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("RLP TYPE GUARD BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- Type Guards ---");
results.push(benchmark("isData - valid bytes", () => isData(data1)));
results.push(benchmark("isData - valid list", () => isData(listData1)));
results.push(benchmark("isData - invalid", () => isData("invalid")));
results.push(benchmark("isBytesData", () => isBytesData(data1)));
results.push(benchmark("isListData", () => isListData(listData1)));

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
// Real-world Use Case Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("RLP REAL-WORLD USE CASE BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- Ethereum Transaction Encoding ---");

// Simplified transaction structure
const nonce = new Uint8Array([0x09]);
const gasPrice = new Uint8Array([0x04, 0xa8, 0x17, 0xc8, 0x00]);
const gasLimit = new Uint8Array([0x52, 0x08]);
const to = new Uint8Array(20).fill(0x01);
const value = new Uint8Array([0x0d, 0xe0, 0xb6, 0xb3, 0xa7, 0x64, 0x00, 0x00]);
const data = new Uint8Array([]);

const simpleTx = [nonce, gasPrice, gasLimit, to, value, data];

results.push(
	benchmark("encode simple transaction", () => encode(simpleTx)),
);

const encodedSimpleTx = encode(simpleTx);
results.push(
	benchmark("decode simple transaction", () => decode(encodedSimpleTx)),
);

// Transaction with data
const txWithData = [
	nonce,
	gasPrice,
	gasLimit,
	to,
	value,
	new Uint8Array(100).fill(0xab), // Contract call data
];

results.push(
	benchmark("encode tx with data (100 bytes)", () => encode(txWithData)),
);

// Transaction with access list (nested structure)
const address = new Uint8Array(20).fill(0xff);
const storageKey = new Uint8Array(32).fill(0xaa);
const accessList = [[address, [storageKey]]];
const txWithAccessList = [
	nonce,
	gasPrice,
	gasLimit,
	to,
	value,
	data,
	accessList,
];

results.push(
	benchmark("encode tx with access list", () => encode(txWithAccessList)),
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

// Calculate statistics
const opsPerSecValues = results.map((r) => r.opsPerSec);
const minOps = Math.min(...opsPerSecValues);
const maxOps = Math.max(...opsPerSecValues);
const avgOps =
	opsPerSecValues.reduce((a, b) => a + b, 0) / opsPerSecValues.length;

console.log(`Fastest operation: ${maxOps.toFixed(0)} ops/sec`);
console.log(`Slowest operation: ${minOps.toFixed(0)} ops/sec`);
console.log(`Average: ${avgOps.toFixed(0)} ops/sec\n`);

// Highlight key metrics
const keyResults = [
	results.find((r) => r.name.includes("encode short bytes")),
	results.find((r) => r.name.includes("decode short bytes")),
	results.find((r) => r.name.includes("encode short list")),
	results.find((r) => r.name.includes("decode short list")),
	results.find((r) => r.name.includes("round-trip short bytes")),
].filter(Boolean) as BenchmarkResult[];

console.log("Key Performance Metrics:");
keyResults.forEach((r) => {
	console.log(
		`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
	);
});

console.log("\n");

// Export results for analysis
if (typeof Bun !== "undefined") {
	const resultsFile =
		"/Users/williamcory/primitives/src/primitives/rlp-results.json";
	await Bun.write(resultsFile, JSON.stringify(results, null, 2));
	console.log(`Results saved to: ${resultsFile}\n`);
}
