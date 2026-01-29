/**
 * Benchmark: TS vs WASM vs viem Hex implementations
 * Compares performance of hex operations across different backends
 */

import { bench, run } from "mitata";
import {
	bytesToHex as viemBytesToHex,
	hexToBytes as viemHexToBytes,
	isHex as viemIsHex,
} from "viem";
import * as loader from "../../wasm-loader/loader.js";
import { fromBytes } from "./fromBytes.js";
import { isHex } from "./isHex.js";
import { toBytes } from "./toBytes.js";
import { validate } from "./validate.js";

// Initialize WASM
await loader.loadWasm(
	new URL("../../wasm-loader/primitives.wasm", import.meta.url),
);

// Test data - 32 bytes
const data32B = new Uint8Array(32).fill(0xab);
const hex32B = `0x${"ab".repeat(32)}`;

// Test data - 256 bytes
const data256B = new Uint8Array(256).fill(0xcd);
const hex256B = `0x${"cd".repeat(256)}`;

// Test data - 1KB
const data1KB = new Uint8Array(1024).fill(0xef);
const hex1KB = `0x${"ef".repeat(1024)}`;

// Invalid hex strings for validation
const invalidNoPrefix = "1234567890abcdef";
const invalidChars = "0xZZZZZZZZ";

// ============================================================================
// fromBytes / bytesToHex - 32B
// ============================================================================

bench("fromBytes - 32B - TS", () => {
	fromBytes(data32B);
});

bench("fromBytes - 32B - WASM", () => {
	loader.bytesToHex(data32B);
});

bench("fromBytes - 32B - viem", () => {
	viemBytesToHex(data32B);
});

await run();

// ============================================================================
// fromBytes / bytesToHex - 256B
// ============================================================================

bench("fromBytes - 256B - TS", () => {
	fromBytes(data256B);
});

bench("fromBytes - 256B - WASM", () => {
	loader.bytesToHex(data256B);
});

bench("fromBytes - 256B - viem", () => {
	viemBytesToHex(data256B);
});

await run();

// ============================================================================
// fromBytes / bytesToHex - 1KB
// ============================================================================

bench("fromBytes - 1KB - TS", () => {
	fromBytes(data1KB);
});

bench("fromBytes - 1KB - WASM", () => {
	loader.bytesToHex(data1KB);
});

bench("fromBytes - 1KB - viem", () => {
	viemBytesToHex(data1KB);
});

await run();

// ============================================================================
// toBytes / hexToBytes - 32B
// ============================================================================

bench("toBytes - 32B - TS", () => {
	toBytes(hex32B);
});

bench("toBytes - 32B - WASM", () => {
	loader.hexToBytes(hex32B);
});

bench("toBytes - 32B - viem", () => {
	viemHexToBytes(hex32B as `0x${string}`);
});

await run();

// ============================================================================
// toBytes / hexToBytes - 256B
// ============================================================================

bench("toBytes - 256B - TS", () => {
	toBytes(hex256B);
});

bench("toBytes - 256B - WASM", () => {
	loader.hexToBytes(hex256B);
});

bench("toBytes - 256B - viem", () => {
	viemHexToBytes(hex256B as `0x${string}`);
});

await run();

// ============================================================================
// toBytes / hexToBytes - 1KB
// ============================================================================

bench("toBytes - 1KB - TS", () => {
	toBytes(hex1KB);
});

bench("toBytes - 1KB - WASM", () => {
	loader.hexToBytes(hex1KB);
});

bench("toBytes - 1KB - viem", () => {
	viemHexToBytes(hex1KB as `0x${string}`);
});

await run();

// ============================================================================
// validate / isHex - valid 32B
// ============================================================================

bench("validate - 32B - TS", () => {
	validate(hex32B);
});

bench("isHex - 32B - TS", () => {
	isHex(hex32B);
});

bench("isHex - 32B - viem", () => {
	viemIsHex(hex32B);
});

await run();

// ============================================================================
// validate / isHex - valid 256B
// ============================================================================

bench("validate - 256B - TS", () => {
	validate(hex256B);
});

bench("isHex - 256B - TS", () => {
	isHex(hex256B);
});

bench("isHex - 256B - viem", () => {
	viemIsHex(hex256B);
});

await run();

// ============================================================================
// validate / isHex - valid 1KB
// ============================================================================

bench("validate - 1KB - TS", () => {
	validate(hex1KB);
});

bench("isHex - 1KB - TS", () => {
	isHex(hex1KB);
});

bench("isHex - 1KB - viem", () => {
	viemIsHex(hex1KB);
});

await run();

// ============================================================================
// isHex - invalid inputs
// ============================================================================

bench("isHex - invalid (no prefix) - TS", () => {
	isHex(invalidNoPrefix);
});

bench("isHex - invalid (no prefix) - viem", () => {
	viemIsHex(invalidNoPrefix);
});

bench("isHex - invalid (bad chars) - TS", () => {
	isHex(invalidChars);
});

bench("isHex - invalid (bad chars) - viem", () => {
	viemIsHex(invalidChars);
});

await run();
