/**
 * Benchmark: JS vs WASM Hash implementations
 * Compares performance of Hash operations across different backends
 */

import { bench, run } from "mitata";
import {
	hashEquals,
	hashFromHex,
	hashToHex,
	loadWasm,
} from "../../wasm-loader/loader.js";
import { equals } from "./equals.js";
import { from } from "./from.js";
import { fromHex } from "./fromHex.js";
import { isHash } from "./isHash.js";
import { isValidHex } from "./isValidHex.js";
import { toHex } from "./toHex.js";

// Load WASM before running benchmarks
await loadWasm(new URL("../../wasm-loader/primitives.wasm", import.meta.url));

// Test data - realistic 32-byte hashes
const validHex =
	"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
const validHex2 =
	"0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef";
const zeroHex =
	"0x0000000000000000000000000000000000000000000000000000000000000000";
const invalidHex = "0x1234";
const invalidChars =
	"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdeg";

// Pre-create hash instances for conversion/comparison benchmarks
const jsHash1 = from(validHex);
const jsHash2 = from(validHex2);
const jsHashSame = from(validHex);
const jsHashZero = from(zeroHex);

const wasmHash1 = hashFromHex(validHex);
const wasmHash2 = hashFromHex(validHex2);
const wasmHashSame = hashFromHex(validHex);
const wasmHashZero = hashFromHex(zeroHex);

// ============================================================================
// from / parse hash
// ============================================================================

bench("from(hexString) - JS", () => {
	from(validHex);
});

bench("from(hexString) - WASM", () => {
	hashFromHex(validHex);
});

await run();

bench("fromHex - JS", () => {
	fromHex(validHex);
});

bench("fromHex - WASM", () => {
	hashFromHex(validHex);
});

await run();

// ============================================================================
// toHex
// ============================================================================

bench("toHex - JS", () => {
	toHex(jsHash1);
});

bench("toHex - WASM", () => {
	hashToHex(wasmHash1);
});

await run();

// ============================================================================
// validate
// ============================================================================

bench("isValidHex - valid - JS", () => {
	isValidHex(validHex);
});

bench("isValidHex - invalid length - JS", () => {
	isValidHex(invalidHex);
});

bench("isValidHex - invalid chars - JS", () => {
	isValidHex(invalidChars);
});

bench("isHash - valid - JS", () => {
	isHash(jsHash1);
});

bench("isHash - invalid (string) - JS", () => {
	isHash(validHex);
});

bench("isHash - invalid (null) - JS", () => {
	isHash(null);
});

await run();

// ============================================================================
// equals
// ============================================================================

bench("equals - same value - JS", () => {
	equals(jsHash1, jsHashSame);
});

bench("equals - same value - WASM", () => {
	hashEquals(wasmHash1, wasmHashSame);
});

await run();

bench("equals - different value - JS", () => {
	equals(jsHash1, jsHash2);
});

bench("equals - different value - WASM", () => {
	hashEquals(wasmHash1, wasmHash2);
});

await run();

bench("equals - zero hash - JS", () => {
	equals(jsHashZero, jsHashZero);
});

bench("equals - zero hash - WASM", () => {
	hashEquals(wasmHashZero, wasmHashZero);
});

await run();
