/**
 * RLP Encoding/Decoding Benchmarks
 *
 * Measures performance of RLP operations
 */

import * as Rlp from "./index.js";

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

const emptyList: Rlp.Encodable[] = [];
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
const encodedSingleByte = Rlp.encode.call(singleByte);
const encodedShortBytes = Rlp.encode.call(shortBytes);
const encodedMediumBytes = Rlp.encode.call(mediumBytes);
const encodedLongBytes = Rlp.encode.call(longBytes);
const encodedVeryLongBytes = Rlp.encode.call(veryLongBytes);

const encodedEmptyList = Rlp.encode.call(emptyList);
const encodedShortList = Rlp.encode.call(shortList);
const encodedMediumList = Rlp.encode.call(mediumList);
const encodedLongList = Rlp.encode.call(longList);
const encodedNestedList = Rlp.encode.call(nestedList);
const encodedDeeplyNested = Rlp.encode.call(deeplyNested);

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
	benchmark("encode single byte (< 0x80)", () => Rlp.encode.call(singleByte)),
);
results.push(
	benchmark("encode short bytes (5 bytes)", () => Rlp.encode.call(shortBytes)),
);
results.push(
	benchmark("encode medium bytes (32 bytes)", () =>
		Rlp.encode.call(mediumBytes),
	),
);
results.push(
	benchmark("encode long bytes (200 bytes)", () => Rlp.encode.call(longBytes)),
);
results.push(
	benchmark("encode very long bytes (10KB)", () =>
		Rlp.encode.call(veryLongBytes),
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
results.push(benchmark("encode empty list", () => Rlp.encode.call(emptyList)));
results.push(
	benchmark("encode short list (2 items)", () => Rlp.encode.call(shortList)),
);
results.push(
	benchmark("encode medium list (10 items)", () => Rlp.encode.call(mediumList)),
);
results.push(
	benchmark("encode long list (100 items)", () => Rlp.encode.call(longList)),
);
results.push(
	benchmark("encode nested list (3 levels)", () => Rlp.encode.call(nestedList)),
);
results.push(
	benchmark("encode deeply nested list (4+ levels)", () =>
		Rlp.encode.call(deeplyNested),
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
	benchmark("decode single byte (< 0x80)", () =>
		Rlp.decode.call(encodedSingleByte),
	),
);
results.push(
	benchmark("decode short bytes (5 bytes)", () =>
		Rlp.decode.call(encodedShortBytes),
	),
);
results.push(
	benchmark("decode medium bytes (32 bytes)", () =>
		Rlp.decode.call(encodedMediumBytes),
	),
);
results.push(
	benchmark("decode long bytes (200 bytes)", () =>
		Rlp.decode.call(encodedLongBytes),
	),
);
results.push(
	benchmark("decode very long bytes (10KB)", () =>
		Rlp.decode.call(encodedVeryLongBytes),
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
	benchmark("decode empty list", () => Rlp.decode.call(encodedEmptyList)),
);
results.push(
	benchmark("decode short list (2 items)", () =>
		Rlp.decode.call(encodedShortList),
	),
);
results.push(
	benchmark("decode medium list (10 items)", () =>
		Rlp.decode.call(encodedMediumList),
	),
);
results.push(
	benchmark("decode long list (100 items)", () =>
		Rlp.decode.call(encodedLongList),
	),
);
results.push(
	benchmark("decode nested list (3 levels)", () =>
		Rlp.decode.call(encodedNestedList),
	),
);
results.push(
	benchmark("decode deeply nested list (4+ levels)", () =>
		Rlp.decode.call(encodedDeeplyNested),
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
		const encoded = Rlp.encode.call(singleByte);
		Rlp.decode.call(encoded);
	}),
);
results.push(
	benchmark("round-trip short bytes (5 bytes)", () => {
		const encoded = Rlp.encode.call(shortBytes);
		Rlp.decode.call(encoded);
	}),
);
results.push(
	benchmark("round-trip medium bytes (32 bytes)", () => {
		const encoded = Rlp.encode.call(mediumBytes);
		Rlp.decode.call(encoded);
	}),
);
results.push(
	benchmark("round-trip long bytes (200 bytes)", () => {
		const encoded = Rlp.encode.call(longBytes);
		Rlp.decode.call(encoded);
	}),
);
results.push(
	benchmark("round-trip short list", () => {
		const encoded = Rlp.encode.call(shortList);
		Rlp.decode.call(encoded);
	}),
);
results.push(
	benchmark("round-trip nested list", () => {
		const encoded = Rlp.encode.call(nestedList);
		Rlp.decode.call(encoded);
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
		Rlp.getEncodedLength.call(mediumBytes),
	),
);
results.push(
	benchmark("getEncodedLength - list", () =>
		Rlp.getEncodedLength.call(mediumList),
	),
);

const flattenData: Rlp.Data = {
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
	benchmark("flatten nested list", () => Rlp.flatten.call(flattenData)),
);

const data1: Rlp.Data = { type: "bytes", value: new Uint8Array([1, 2, 3]) };
const data2: Rlp.Data = { type: "bytes", value: new Uint8Array([1, 2, 3]) };

results.push(
	benchmark("equals - bytes Data", () => Rlp.equals.call(data1, data2)),
);

const listData1: Rlp.Data = {
	type: "list",
	value: [
		{ type: "bytes", value: new Uint8Array([1]) },
		{ type: "bytes", value: new Uint8Array([2]) },
	],
};
const listData2: Rlp.Data = {
	type: "list",
	value: [
		{ type: "bytes", value: new Uint8Array([1]) },
		{ type: "bytes", value: new Uint8Array([2]) },
	],
};

results.push(
	benchmark("equals - list Data", () => Rlp.equals.call(listData1, listData2)),
);

results.push(benchmark("toJSON - bytes", () => Rlp.toJSON.call(data1)));
results.push(benchmark("toJSON - list", () => Rlp.toJSON.call(listData1)));

const jsonData = { type: "bytes", value: [1, 2, 3] };
results.push(benchmark("fromJSON - bytes", () => Rlp.fromJSON.call(jsonData)));

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
	benchmark("Data.fromBytes", () => Rlp.Data.fromBytes.call(mediumBytes)),
);
results.push(
	benchmark("Data.fromList", () =>
		Rlp.Data.fromList.call([
			{ type: "bytes", value: new Uint8Array([1]) },
			{ type: "bytes", value: new Uint8Array([2]) },
		]),
	),
);
results.push(
	benchmark("Data.encodeData", () => Rlp.Data.encodeData.call(data1)),
);
results.push(benchmark("Data.toBytes", () => Rlp.Data.toBytes.call(data1)));
results.push(benchmark("Data.toList", () => Rlp.Data.toList.call(listData1)));

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
results.push(benchmark("isData - valid bytes", () => Rlp.isData(data1)));
results.push(benchmark("isData - valid list", () => Rlp.isData(listData1)));
results.push(benchmark("isData - invalid", () => Rlp.isData("invalid")));
results.push(benchmark("isBytesData", () => Rlp.isBytesData(data1)));
results.push(benchmark("isListData", () => Rlp.isListData(listData1)));

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
	benchmark("encode simple transaction", () => Rlp.encode.call(simpleTx)),
);

const encodedSimpleTx = Rlp.encode.call(simpleTx);
results.push(
	benchmark("decode simple transaction", () =>
		Rlp.decode.call(encodedSimpleTx),
	),
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
	benchmark("encode tx with data (100 bytes)", () =>
		Rlp.encode.call(txWithData),
	),
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
	benchmark("encode tx with access list", () =>
		Rlp.encode.call(txWithAccessList),
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
