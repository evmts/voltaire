/**
 * RevertReason Benchmarks: Voltaire TS
 *
 * Compares performance of revert reason parsing and decoding.
 * RevertReason decodes error return data from failed transactions.
 */

import { bench, run } from "mitata";
import * as RevertReason from "./index.js";

// ============================================================================
// Test Data
// ============================================================================

function hexToBytes(hex: string): Uint8Array {
	const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
	const bytes = new Uint8Array(clean.length / 2);
	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = Number.parseInt(clean.slice(i * 2, i * 2 + 2), 16);
	}
	return bytes;
}

// Error(string) - "Insufficient balance"
// Selector: 0x08c379a0
const ERROR_STRING_DATA = hexToBytes(
	"0x08c379a0" + // Error(string) selector
		"0000000000000000000000000000000000000000000000000000000000000020" + // offset
		"0000000000000000000000000000000000000000000000000000000000000014" + // length (20)
		"496e73756666696369656e742062616c616e636500000000000000000000000000", // "Insufficient balance"
);

// Error(string) - short message "fail"
const ERROR_SHORT_DATA = hexToBytes(
	"0x08c379a0" +
		"0000000000000000000000000000000000000000000000000000000000000020" +
		"0000000000000000000000000000000000000000000000000000000000000004" +
		"6661696c00000000000000000000000000000000000000000000000000000000",
);

// Panic(uint256) - arithmetic overflow (0x11)
const PANIC_OVERFLOW_DATA = hexToBytes(
	"0x4e487b71" + // Panic(uint256) selector
		"0000000000000000000000000000000000000000000000000000000000000011", // code 0x11 (overflow)
);

// Panic(uint256) - division by zero (0x12)
const PANIC_DIVISION_DATA = hexToBytes(
	"0x4e487b71" +
		"0000000000000000000000000000000000000000000000000000000000000012",
);

// Panic(uint256) - array out of bounds (0x32)
const PANIC_BOUNDS_DATA = hexToBytes(
	"0x4e487b71" +
		"0000000000000000000000000000000000000000000000000000000000000032",
);

// Custom error - InsufficientBalance(address,uint256,uint256)
// Selector: first 4 bytes of keccak256("InsufficientBalance(address,uint256,uint256)")
const CUSTOM_ERROR_DATA = hexToBytes(
	"0xcf479181" + // custom selector (example)
		"000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48" + // address
		"0000000000000000000000000000000000000000000000000000000005f5e100" + // required (100000000)
		"0000000000000000000000000000000000000000000000000000000001312d00", // available (20000000)
);

// Empty return data
const EMPTY_DATA = new Uint8Array(0);

// Unknown/malformed data
const UNKNOWN_DATA = hexToBytes("0xdeadbeef1234567890");

// Pre-created reasons for toString benchmarks
const errorReason = RevertReason.from(ERROR_STRING_DATA);
const panicReason = RevertReason.from(PANIC_OVERFLOW_DATA);
const customReason = RevertReason.from(CUSTOM_ERROR_DATA);
const unknownReason = RevertReason.from(UNKNOWN_DATA);

// ============================================================================
// from benchmarks (parsing)
// ============================================================================

bench("from - Error(string) - voltaire", () => {
	RevertReason.from(ERROR_STRING_DATA);
});

bench("from - Error(string) short - voltaire", () => {
	RevertReason.from(ERROR_SHORT_DATA);
});

bench("from - Panic overflow - voltaire", () => {
	RevertReason.from(PANIC_OVERFLOW_DATA);
});

bench("from - Panic division - voltaire", () => {
	RevertReason.from(PANIC_DIVISION_DATA);
});

await run();

bench("from - Panic bounds - voltaire", () => {
	RevertReason.from(PANIC_BOUNDS_DATA);
});

bench("from - custom error - voltaire", () => {
	RevertReason.from(CUSTOM_ERROR_DATA);
});

bench("from - empty data - voltaire", () => {
	RevertReason.from(EMPTY_DATA);
});

bench("from - unknown data - voltaire", () => {
	RevertReason.from(UNKNOWN_DATA);
});

await run();

// ============================================================================
// toString benchmarks
// ============================================================================

bench("toString - Error reason - voltaire", () => {
	RevertReason.toString(errorReason);
});

bench("toString - Panic reason - voltaire", () => {
	RevertReason.toString(panicReason);
});

bench("toString - custom error - voltaire", () => {
	RevertReason.toString(customReason);
});

bench("toString - unknown - voltaire", () => {
	RevertReason.toString(unknownReason);
});

await run();

// ============================================================================
// Batch operations
// ============================================================================

const errorDataSamples = [
	ERROR_STRING_DATA,
	ERROR_SHORT_DATA,
	PANIC_OVERFLOW_DATA,
	PANIC_DIVISION_DATA,
	PANIC_BOUNDS_DATA,
	CUSTOM_ERROR_DATA,
	EMPTY_DATA,
	UNKNOWN_DATA,
];

bench("from - 8 different errors - voltaire", () => {
	for (const data of errorDataSamples) {
		RevertReason.from(data);
	}
});

await run();

const parsedReasons = errorDataSamples.map((d) => RevertReason.from(d));

bench("toString - 8 different errors - voltaire", () => {
	for (const reason of parsedReasons) {
		RevertReason.toString(reason);
	}
});

await run();

// ============================================================================
// Realistic scenario: parse and display
// ============================================================================

bench("parse + toString - Error(string) - voltaire", () => {
	const reason = RevertReason.from(ERROR_STRING_DATA);
	RevertReason.toString(reason);
});

bench("parse + toString - Panic - voltaire", () => {
	const reason = RevertReason.from(PANIC_OVERFLOW_DATA);
	RevertReason.toString(reason);
});

await run();
