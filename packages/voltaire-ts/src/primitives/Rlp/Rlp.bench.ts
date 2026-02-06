/**
 * Benchmark: TS vs WASM vs viem RLP implementations
 * Compares performance of RLP encoding/decoding operations
 *
 * Note: WASM only supports encodeBytes for raw byte arrays.
 * List encoding is not available in WASM yet.
 */

import { bench, run } from "mitata";
import { fromRlp, toRlp } from "viem";
import * as loader from "../../wasm-loader/loader.js";
import * as Hex from "../Hex/index.js";
import { Rlp } from "./index.js";
import * as RlpWasm from "./Rlp.wasm.js";

// Initialize WASM before benchmarks
await loader.loadWasm(
	new URL("../../wasm-loader/primitives.wasm", import.meta.url),
);

// Test data - bytes
const singleByte = new Uint8Array([0x42]);
const shortBytes = new Uint8Array([1, 2, 3, 4, 5]);
const mediumBytes = new Uint8Array(55).fill(0xab); // Boundary: short string max
const longBytes = new Uint8Array(200).fill(0xcd);
const veryLongBytes = new Uint8Array(1024).fill(0xef);

// Test data - nested lists
const shortList = [new Uint8Array([0x01]), new Uint8Array([0x02])];
const mediumList = Array.from(
	{ length: 10 },
	(_, i) => new Uint8Array([i % 256]),
);
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

// Pre-encoded data for decode benchmarks
const encodedSingleByte = Rlp.encode(singleByte);
const encodedShortBytes = Rlp.encode(shortBytes);
const encodedMediumBytes = Rlp.encode(mediumBytes);
const encodedLongBytes = Rlp.encode(longBytes);
const encodedVeryLongBytes = Rlp.encode(veryLongBytes);
const encodedShortList = Rlp.encode(shortList);
const encodedMediumList = Rlp.encode(mediumList);
const encodedLongList = Rlp.encode(longList);
const encodedNestedList = Rlp.encode(nestedList);
const encodedDeeplyNested = Rlp.encode(deeplyNested);

// Hex versions for viem (viem uses hex strings)
const singleByteHex = Hex.fromBytes(singleByte);
const shortBytesHex = Hex.fromBytes(shortBytes);
const mediumBytesHex = Hex.fromBytes(mediumBytes);
const longBytesHex = Hex.fromBytes(longBytes);
const veryLongBytesHex = Hex.fromBytes(veryLongBytes);

const encodedSingleByteHex = Hex.fromBytes(encodedSingleByte);
const encodedShortBytesHex = Hex.fromBytes(encodedShortBytes);
const encodedMediumBytesHex = Hex.fromBytes(encodedMediumBytes);
const encodedLongBytesHex = Hex.fromBytes(encodedLongBytes);
const encodedVeryLongBytesHex = Hex.fromBytes(encodedVeryLongBytes);
const encodedShortListHex = Hex.fromBytes(encodedShortList);
const encodedMediumListHex = Hex.fromBytes(encodedMediumList);
const encodedLongListHex = Hex.fromBytes(encodedLongList);
const encodedNestedListHex = Hex.fromBytes(encodedNestedList);
const encodedDeeplyNestedHex = Hex.fromBytes(encodedDeeplyNested);

// Viem list inputs (hex strings in arrays)
const shortListViem = [
	"0x01" as const,
	"0x02" as const,
] as readonly `0x${string}`[];
const mediumListViem = Array.from(
	{ length: 10 },
	(_, i) => `0x${i.toString(16).padStart(2, "0")}` as `0x${string}`,
) as readonly `0x${string}`[];
const longListViem = Array.from(
	{ length: 100 },
	(_, i) => `0x${(i % 256).toString(16).padStart(2, "0")}` as `0x${string}`,
) as readonly `0x${string}`[];
const nestedListViem = [
	"0x01",
	["0x02", "0x03"],
	[["0x04"]],
] as readonly unknown[];
const deeplyNestedViem = [[[["0x01", "0x02"]]]] as readonly unknown[];

// ============================================================================
// ENCODE - Single Byte
// ============================================================================

bench("encode - single byte - TS", () => {
	Rlp.encode(singleByte);
});

bench("encode - single byte - WASM", () => {
	RlpWasm.encodeBytes(singleByte);
});

bench("encode - single byte - viem", () => {
	toRlp(singleByteHex);
});

await run();

// ============================================================================
// ENCODE - Short Bytes (5 bytes)
// ============================================================================

bench("encode - short bytes (5B) - TS", () => {
	Rlp.encode(shortBytes);
});

bench("encode - short bytes (5B) - WASM", () => {
	RlpWasm.encodeBytes(shortBytes);
});

bench("encode - short bytes (5B) - viem", () => {
	toRlp(shortBytesHex);
});

await run();

// ============================================================================
// ENCODE - Medium Bytes (55 bytes - boundary)
// ============================================================================

bench("encode - medium bytes (55B) - TS", () => {
	Rlp.encode(mediumBytes);
});

bench("encode - medium bytes (55B) - WASM", () => {
	RlpWasm.encodeBytes(mediumBytes);
});

bench("encode - medium bytes (55B) - viem", () => {
	toRlp(mediumBytesHex);
});

await run();

// ============================================================================
// ENCODE - Long Bytes (200 bytes)
// ============================================================================

bench("encode - long bytes (200B) - TS", () => {
	Rlp.encode(longBytes);
});

bench("encode - long bytes (200B) - WASM", () => {
	RlpWasm.encodeBytes(longBytes);
});

bench("encode - long bytes (200B) - viem", () => {
	toRlp(longBytesHex);
});

await run();

// ============================================================================
// ENCODE - Very Long Bytes (1KB)
// ============================================================================

bench("encode - very long bytes (1KB) - TS", () => {
	Rlp.encode(veryLongBytes);
});

bench("encode - very long bytes (1KB) - WASM", () => {
	RlpWasm.encodeBytes(veryLongBytes);
});

bench("encode - very long bytes (1KB) - viem", () => {
	toRlp(veryLongBytesHex);
});

await run();

// ============================================================================
// ENCODE - Short List (2 items)
// ============================================================================

bench("encode - short list (2 items) - TS", () => {
	Rlp.encode(shortList);
});

bench("encode - short list (2 items) - viem", () => {
	toRlp(shortListViem);
});

await run();

// ============================================================================
// ENCODE - Medium List (10 items)
// ============================================================================

bench("encode - medium list (10 items) - TS", () => {
	Rlp.encode(mediumList);
});

bench("encode - medium list (10 items) - viem", () => {
	toRlp(mediumListViem);
});

await run();

// ============================================================================
// ENCODE - Long List (100 items)
// ============================================================================

bench("encode - long list (100 items) - TS", () => {
	Rlp.encode(longList);
});

bench("encode - long list (100 items) - viem", () => {
	toRlp(longListViem);
});

await run();

// ============================================================================
// ENCODE - Nested List (3 levels)
// ============================================================================

bench("encode - nested list (3 levels) - TS", () => {
	Rlp.encode(nestedList);
});

bench("encode - nested list (3 levels) - viem", () => {
	toRlp(nestedListViem as Parameters<typeof toRlp>[0]);
});

await run();

// ============================================================================
// ENCODE - Deeply Nested (4+ levels)
// ============================================================================

bench("encode - deeply nested (4+ levels) - TS", () => {
	Rlp.encode(deeplyNested);
});

bench("encode - deeply nested (4+ levels) - viem", () => {
	toRlp(deeplyNestedViem as Parameters<typeof toRlp>[0]);
});

await run();

// ============================================================================
// DECODE - Single Byte
// ============================================================================

bench("decode - single byte - TS", () => {
	Rlp.decode(encodedSingleByte);
});

bench("decode - single byte - viem", () => {
	fromRlp(encodedSingleByteHex);
});

await run();

// ============================================================================
// DECODE - Short Bytes
// ============================================================================

bench("decode - short bytes (5B) - TS", () => {
	Rlp.decode(encodedShortBytes);
});

bench("decode - short bytes (5B) - viem", () => {
	fromRlp(encodedShortBytesHex);
});

await run();

// ============================================================================
// DECODE - Medium Bytes
// ============================================================================

bench("decode - medium bytes (55B) - TS", () => {
	Rlp.decode(encodedMediumBytes);
});

bench("decode - medium bytes (55B) - viem", () => {
	fromRlp(encodedMediumBytesHex);
});

await run();

// ============================================================================
// DECODE - Long Bytes
// ============================================================================

bench("decode - long bytes (200B) - TS", () => {
	Rlp.decode(encodedLongBytes);
});

bench("decode - long bytes (200B) - viem", () => {
	fromRlp(encodedLongBytesHex);
});

await run();

// ============================================================================
// DECODE - Very Long Bytes
// ============================================================================

bench("decode - very long bytes (1KB) - TS", () => {
	Rlp.decode(encodedVeryLongBytes);
});

bench("decode - very long bytes (1KB) - viem", () => {
	fromRlp(encodedVeryLongBytesHex);
});

await run();

// ============================================================================
// DECODE - Short List
// ============================================================================

bench("decode - short list (2 items) - TS", () => {
	Rlp.decode(encodedShortList);
});

bench("decode - short list (2 items) - viem", () => {
	fromRlp(encodedShortListHex);
});

await run();

// ============================================================================
// DECODE - Medium List
// ============================================================================

bench("decode - medium list (10 items) - TS", () => {
	Rlp.decode(encodedMediumList);
});

bench("decode - medium list (10 items) - viem", () => {
	fromRlp(encodedMediumListHex);
});

await run();

// ============================================================================
// DECODE - Long List
// ============================================================================

bench("decode - long list (100 items) - TS", () => {
	Rlp.decode(encodedLongList);
});

bench("decode - long list (100 items) - viem", () => {
	fromRlp(encodedLongListHex);
});

await run();

// ============================================================================
// DECODE - Nested List
// ============================================================================

bench("decode - nested list (3 levels) - TS", () => {
	Rlp.decode(encodedNestedList);
});

bench("decode - nested list (3 levels) - viem", () => {
	fromRlp(encodedNestedListHex);
});

await run();

// ============================================================================
// DECODE - Deeply Nested
// ============================================================================

bench("decode - deeply nested (4+ levels) - TS", () => {
	Rlp.decode(encodedDeeplyNested);
});

bench("decode - deeply nested (4+ levels) - viem", () => {
	fromRlp(encodedDeeplyNestedHex);
});

await run();

// ============================================================================
// ROUND-TRIP
// ============================================================================

bench("round-trip - short bytes - TS", () => {
	Rlp.decode(Rlp.encode(shortBytes));
});

bench("round-trip - short bytes - viem", () => {
	fromRlp(toRlp(shortBytesHex));
});

await run();

bench("round-trip - nested list - TS", () => {
	Rlp.decode(Rlp.encode(nestedList));
});

bench("round-trip - nested list - viem", () => {
	fromRlp(toRlp(nestedListViem as Parameters<typeof toRlp>[0]));
});

await run();

// ============================================================================
// TRANSACTION-LIKE STRUCTURE
// ============================================================================

// Simplified transaction structure
const nonce = new Uint8Array([0x09]);
const gasPrice = new Uint8Array([0x04, 0xa8, 0x17, 0xc8, 0x00]);
const gasLimit = new Uint8Array([0x52, 0x08]);
const to = new Uint8Array(20).fill(0x01);
const value = new Uint8Array([0x0d, 0xe0, 0xb6, 0xb3, 0xa7, 0x64, 0x00, 0x00]);
const data = new Uint8Array([]);

const simpleTx = [nonce, gasPrice, gasLimit, to, value, data];
const simpleTxViem = [
	Hex.fromBytes(nonce),
	Hex.fromBytes(gasPrice),
	Hex.fromBytes(gasLimit),
	Hex.fromBytes(to),
	Hex.fromBytes(value),
	"0x" as const,
] as readonly `0x${string}`[];

const encodedSimpleTx = Rlp.encode(simpleTx);
const encodedSimpleTxHex = Hex.fromBytes(encodedSimpleTx);

bench("encode - transaction-like - TS", () => {
	Rlp.encode(simpleTx);
});

bench("encode - transaction-like - viem", () => {
	toRlp(simpleTxViem);
});

await run();

bench("decode - transaction-like - TS", () => {
	Rlp.decode(encodedSimpleTx);
});

bench("decode - transaction-like - viem", () => {
	fromRlp(encodedSimpleTxHex);
});

await run();

// Transaction with access list (more complex nested structure)
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

const addressHex = Hex.fromBytes(address);
const storageKeyHex = Hex.fromBytes(storageKey);
const accessListViem = [[addressHex, [storageKeyHex]]] as readonly unknown[];
const txWithAccessListViem = [
	...simpleTxViem,
	accessListViem,
] as readonly unknown[];

bench("encode - tx with access list - TS", () => {
	Rlp.encode(txWithAccessList);
});

bench("encode - tx with access list - viem", () => {
	toRlp(txWithAccessListViem as Parameters<typeof toRlp>[0]);
});

await run();
