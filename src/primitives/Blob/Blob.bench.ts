/**
 * Benchmark: TypeScript vs WASM Blob implementations (EIP-4844)
 * Compares performance of blob operations across different backends
 */

import { bench, run } from "mitata";
import {
	blobFromData,
	blobIsValid,
	blobToData,
	bytesToHex,
	hexToBytes,
	loadWasm,
} from "../../wasm-loader/loader.js";
import { Hex } from "../Hex/index.js";
import { fromDataWasm, isValidWasm, toDataWasm } from "./Blob.wasm.js";
import { from } from "./from.js";
import { fromData } from "./fromData.js";
import { isValid } from "./isValid.js";
import { toData } from "./toData.js";

// Initialize WASM
const WASM_PATH = new URL("../../wasm-loader/primitives.wasm", import.meta.url);
await loadWasm(WASM_PATH);

// ============================================================================
// Test Data
// ============================================================================

// Small data (simulates small calldata)
const smallData = new TextEncoder().encode("Hello, EIP-4844 blob!");

// Medium data (10KB - typical contract interaction)
const mediumData = new Uint8Array(10_000).fill(0xab);

// Large data (100KB - significant payload)
const largeData = new Uint8Array(100_000).fill(0xcd);

// Max data (126972 bytes - maximum per blob)
const maxData = new Uint8Array(126_972).fill(0xef);

// Pre-encoded blobs for decode benchmarks - each impl uses its own blobs
const smallBlobTs = fromData(smallData);
const mediumBlobTs = fromData(mediumData);
const largeBlobTs = fromData(largeData);
const maxBlobTs = fromData(maxData);

const smallBlobWasm = blobFromData(smallData);
const mediumBlobWasm = blobFromData(mediumData);
const largeBlobWasm = blobFromData(largeData);
const maxBlobWasm = blobFromData(maxData);

// Hex strings for hex conversion benchmarks
const smallBlobHex = Hex.fromBytes(smallBlobTs);
const mediumBlobHex = Hex.fromBytes(mediumBlobTs);

// ============================================================================
// fromData / Parse Benchmarks
// ============================================================================

bench("fromData - small (21B) - TS", () => {
	fromData(smallData);
});

bench("fromData - small (21B) - WASM (loader)", () => {
	blobFromData(smallData);
});

bench("fromData - small (21B) - WASM (wrapper)", () => {
	fromDataWasm(smallData);
});

await run();

bench("fromData - medium (10KB) - TS", () => {
	fromData(mediumData);
});

bench("fromData - medium (10KB) - WASM (loader)", () => {
	blobFromData(mediumData);
});

bench("fromData - medium (10KB) - WASM (wrapper)", () => {
	fromDataWasm(mediumData);
});

await run();

bench("fromData - large (100KB) - TS", () => {
	fromData(largeData);
});

bench("fromData - large (100KB) - WASM (loader)", () => {
	blobFromData(largeData);
});

bench("fromData - large (100KB) - WASM (wrapper)", () => {
	fromDataWasm(largeData);
});

await run();

bench("fromData - max (127KB) - TS", () => {
	fromData(maxData);
});

bench("fromData - max (127KB) - WASM (loader)", () => {
	blobFromData(maxData);
});

bench("fromData - max (127KB) - WASM (wrapper)", () => {
	fromDataWasm(maxData);
});

await run();

// ============================================================================
// from (auto-detect) Benchmarks
// ============================================================================

bench("from - raw blob (128KB) - TS", () => {
	from(smallBlobTs);
});

bench("from - encode data (10KB) - TS", () => {
	from(mediumData);
});

await run();

// ============================================================================
// toData Benchmarks
// ============================================================================

bench("toData - small - TS", () => {
	toData(smallBlobTs);
});

bench("toData - small - WASM (loader)", () => {
	blobToData(smallBlobWasm);
});

bench("toData - small - WASM (wrapper)", () => {
	toDataWasm(smallBlobWasm);
});

await run();

bench("toData - medium - TS", () => {
	toData(mediumBlobTs);
});

bench("toData - medium - WASM (loader)", () => {
	blobToData(mediumBlobWasm);
});

bench("toData - medium - WASM (wrapper)", () => {
	toDataWasm(mediumBlobWasm);
});

await run();

bench("toData - large - TS", () => {
	toData(largeBlobTs);
});

bench("toData - large - WASM (loader)", () => {
	blobToData(largeBlobWasm);
});

bench("toData - large - WASM (wrapper)", () => {
	toDataWasm(largeBlobWasm);
});

await run();

bench("toData - max - TS", () => {
	toData(maxBlobTs);
});

bench("toData - max - WASM (loader)", () => {
	blobToData(maxBlobWasm);
});

bench("toData - max - WASM (wrapper)", () => {
	toDataWasm(maxBlobWasm);
});

await run();

// ============================================================================
// Validation Benchmarks
// ============================================================================

bench("isValid - valid blob - TS", () => {
	isValid(smallBlobTs);
});

bench("isValid - valid blob - WASM", () => {
	blobIsValid(smallBlobTs.length);
});

bench("isValid - valid blob - WASM (wrapper)", () => {
	isValidWasm(smallBlobTs.length);
});

await run();

bench("isValid - invalid (wrong size) - TS", () => {
	isValid(smallData);
});

bench("isValid - invalid (wrong size) - WASM", () => {
	blobIsValid(smallData.length);
});

bench("isValid - invalid (wrong size) - WASM (wrapper)", () => {
	isValidWasm(smallData.length);
});

await run();

// ============================================================================
// Hex Conversion Benchmarks
// ============================================================================

bench("toHex - small blob - TS (Hex.fromBytes)", () => {
	Hex.fromBytes(smallBlobTs);
});

bench("toHex - small blob - WASM (bytesToHex)", () => {
	bytesToHex(smallBlobTs);
});

await run();

bench("toHex - medium blob - TS (Hex.fromBytes)", () => {
	Hex.fromBytes(mediumBlobTs);
});

bench("toHex - medium blob - WASM (bytesToHex)", () => {
	bytesToHex(mediumBlobTs);
});

await run();

bench("fromHex - small blob - TS (Hex.toBytes)", () => {
	Hex.toBytes(smallBlobHex);
});

bench("fromHex - small blob - WASM (hexToBytes)", () => {
	hexToBytes(smallBlobHex);
});

await run();

bench("fromHex - medium blob - TS (Hex.toBytes)", () => {
	Hex.toBytes(mediumBlobHex);
});

bench("fromHex - medium blob - WASM (hexToBytes)", () => {
	hexToBytes(mediumBlobHex);
});

await run();

// ============================================================================
// Round-trip Benchmarks
// ============================================================================

bench("roundtrip (encode + decode) - small - TS", () => {
	const blob = fromData(smallData);
	toData(blob);
});

bench("roundtrip (encode + decode) - small - WASM", () => {
	const blob = blobFromData(smallData);
	blobToData(blob);
});

await run();

bench("roundtrip (encode + decode) - medium - TS", () => {
	const blob = fromData(mediumData);
	toData(blob);
});

bench("roundtrip (encode + decode) - medium - WASM", () => {
	const blob = blobFromData(mediumData);
	blobToData(blob);
});

await run();

bench("roundtrip (encode + decode) - large - TS", () => {
	const blob = fromData(largeData);
	toData(blob);
});

bench("roundtrip (encode + decode) - large - WASM", () => {
	const blob = blobFromData(largeData);
	blobToData(blob);
});

await run();
