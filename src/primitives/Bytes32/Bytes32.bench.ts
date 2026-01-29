/**
 * Benchmark: Bytes32 operations
 * Compares performance of 32-byte fixed-size array operations
 */

import { bench, run } from "mitata";
import {
	bytesToHex as viemBytesToHex,
	hexToBytes as viemHexToBytes,
	isBytes as viemIsBytes,
} from "viem";
import { Bytes32 } from "./index.js";

// Test data
const testHex =
	"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
const zeroHex =
	"0x0000000000000000000000000000000000000000000000000000000000000000";
const testBytes = new Uint8Array(32);
for (let i = 0; i < 32; i++) {
	testBytes[i] = i + 1;
}

const testBigInt = 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdefn;
const testNumber = 123456789;

// Pre-created Bytes32 values for operations
const bytes32_1 = Bytes32.from(testHex);
const bytes32_2 = Bytes32.from(zeroHex);
const bytes32_3 = Bytes32.fromBytes(testBytes);

// ============================================================================
// Construction Benchmarks
// ============================================================================

bench("from(hex) - Voltaire", () => {
	Bytes32.from(testHex);
});

bench("hexToBytes - viem", () => {
	viemHexToBytes(testHex as `0x${string}`);
});

await run();

bench("fromHex - Voltaire", () => {
	Bytes32.fromHex(testHex);
});

await run();

bench("fromBytes - Voltaire", () => {
	Bytes32.fromBytes(testBytes);
});

await run();

bench("fromBigint - Voltaire", () => {
	Bytes32.fromBigint(testBigInt);
});

await run();

bench("fromNumber - Voltaire", () => {
	Bytes32.fromNumber(testNumber);
});

await run();

bench("zero - Voltaire", () => {
	Bytes32.zero();
});

await run();

// ============================================================================
// Conversion Benchmarks
// ============================================================================

bench("toHex - Voltaire", () => {
	Bytes32.toHex(bytes32_1);
});

bench("bytesToHex - viem", () => {
	viemBytesToHex(testBytes);
});

await run();

bench("toBigint - Voltaire", () => {
	Bytes32.toBigint(bytes32_1);
});

await run();

bench("toNumber - small value - Voltaire", () => {
	Bytes32.toNumber(Bytes32.fromNumber(testNumber));
});

await run();

// ============================================================================
// Comparison Benchmarks
// ============================================================================

bench("equals - same - Voltaire", () => {
	Bytes32.equals(bytes32_1, bytes32_1);
});

bench("equals - different - Voltaire", () => {
	Bytes32.equals(bytes32_1, bytes32_2);
});

await run();

bench("compare - Voltaire", () => {
	Bytes32.compare(bytes32_1, bytes32_2);
});

await run();

bench("isZero - zero - Voltaire", () => {
	Bytes32.isZero(bytes32_2);
});

bench("isZero - non-zero - Voltaire", () => {
	Bytes32.isZero(bytes32_1);
});

await run();

// ============================================================================
// Utility Benchmarks
// ============================================================================

bench("clone - Voltaire", () => {
	Bytes32.clone(bytes32_1);
});

await run();

// ============================================================================
// Bitwise Operations Benchmarks
// ============================================================================

bench("bitwiseAnd - Voltaire", () => {
	Bytes32.bitwiseAnd(bytes32_1, bytes32_3);
});

await run();

bench("bitwiseOr - Voltaire", () => {
	Bytes32.bitwiseOr(bytes32_1, bytes32_3);
});

await run();

bench("bitwiseXor - Voltaire", () => {
	Bytes32.bitwiseXor(bytes32_1, bytes32_3);
});

await run();

// ============================================================================
// Min/Max Benchmarks
// ============================================================================

bench("min - Voltaire", () => {
	Bytes32.min(bytes32_1, bytes32_3);
});

bench("max - Voltaire", () => {
	Bytes32.max(bytes32_1, bytes32_3);
});

await run();

// ============================================================================
// Round-trip Benchmarks
// ============================================================================

bench("roundtrip hex - Voltaire", () => {
	Bytes32.toHex(Bytes32.fromHex(testHex));
});

bench("roundtrip hex - viem", () => {
	viemBytesToHex(viemHexToBytes(testHex as `0x${string}`));
});

await run();

bench("roundtrip bigint - Voltaire", () => {
	Bytes32.toBigint(Bytes32.fromBigint(testBigInt));
});

await run();

// ============================================================================
// Type Checking Benchmarks (via constants)
// ============================================================================

bench("SIZE constant access - Voltaire", () => {
	const _size = Bytes32.SIZE;
});

bench("ZERO constant access - Voltaire", () => {
	const _zero = Bytes32.ZERO;
});

await run();
