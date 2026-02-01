/**
 * Benchmark: Bytes operations
 * Compares performance of Bytes manipulation operations
 */

import { bench, run } from "mitata";
import {
	bytesToHex as viemBytesToHex,
	concat as viemConcat,
	hexToBytes as viemHexToBytes,
	isBytes as viemIsBytes,
	pad as viemPad,
	slice as viemSlice,
	trim as viemTrim,
} from "viem";
import { Bytes } from "./Bytes.js";

// Test data
const smallBytes = new Uint8Array(32).fill(0x42);
const mediumBytes = new Uint8Array(256).fill(0x43);
const largeBytes = new Uint8Array(1024).fill(0x44);
const _xlargeBytes = new Uint8Array(4096).fill(0x45);

const smallHex = `0x${"42".repeat(32)}`;
const mediumHex = `0x${"43".repeat(256)}`;

// Pre-created Bytes for operations
const bytes1 = Bytes.from(smallBytes);
const bytes2 = Bytes.from(mediumBytes);
const bytes3 = Bytes.from(largeBytes);

// Bytes with leading zeros for trim tests
const withLeadingZeros = Bytes.from(
	new Uint8Array([0, 0, 0, 0, 1, 2, 3, 4, 5]),
);
const withTrailingZeros = Bytes.from(
	new Uint8Array([1, 2, 3, 4, 5, 0, 0, 0, 0]),
);

// ============================================================================
// Construction Benchmarks
// ============================================================================

bench("from(Uint8Array) - 32B - Voltaire", () => {
	Bytes.from(smallBytes);
});

bench("from(Uint8Array) - 256B - Voltaire", () => {
	Bytes.from(mediumBytes);
});

bench("from(Uint8Array) - 1KB - Voltaire", () => {
	Bytes.from(largeBytes);
});

await run();

bench("fromHex - 32B - Voltaire", () => {
	Bytes.fromHex(smallHex);
});

bench("hexToBytes - 32B - viem", () => {
	viemHexToBytes(smallHex as `0x${string}`);
});

await run();

bench("fromHex - 256B - Voltaire", () => {
	Bytes.fromHex(mediumHex);
});

bench("hexToBytes - 256B - viem", () => {
	viemHexToBytes(mediumHex as `0x${string}`);
});

await run();

bench("fromNumber - Voltaire", () => {
	Bytes.fromNumber(123456789);
});

await run();

bench("fromBigInt - small - Voltaire", () => {
	Bytes.fromBigInt(1000n);
});

bench("fromBigInt - large - Voltaire", () => {
	Bytes.fromBigInt(2n ** 128n);
});

await run();

bench("fromString - Voltaire", () => {
	Bytes.fromString("Hello, World!");
});

await run();

// ============================================================================
// Conversion Benchmarks
// ============================================================================

bench("toHex - 32B - Voltaire", () => {
	Bytes.toHex(bytes1);
});

bench("bytesToHex - 32B - viem", () => {
	viemBytesToHex(smallBytes);
});

await run();

bench("toHex - 256B - Voltaire", () => {
	Bytes.toHex(bytes2);
});

bench("bytesToHex - 256B - viem", () => {
	viemBytesToHex(mediumBytes);
});

await run();

bench("toBigInt - 32B - Voltaire", () => {
	Bytes.toBigInt(bytes1);
});

await run();

bench("toNumber - small - Voltaire", () => {
	Bytes.toNumber(Bytes.from([0x01, 0x02, 0x03, 0x04]));
});

await run();

bench("toString - Voltaire", () => {
	Bytes.toString(Bytes.fromString("Hello, World!"));
});

await run();

// ============================================================================
// Utility Benchmarks
// ============================================================================

bench("clone - 32B - Voltaire", () => {
	Bytes.clone(bytes1);
});

bench("clone - 1KB - Voltaire", () => {
	Bytes.clone(bytes3);
});

await run();

bench("size - Voltaire", () => {
	Bytes.size(bytes2);
});

await run();

bench("isEmpty - empty - Voltaire", () => {
	Bytes.isEmpty(Bytes.from([]));
});

bench("isEmpty - non-empty - Voltaire", () => {
	Bytes.isEmpty(bytes1);
});

await run();

// ============================================================================
// Comparison Benchmarks
// ============================================================================

bench("equals - same - Voltaire", () => {
	Bytes.equals(bytes1, bytes1);
});

bench("equals - different - Voltaire", () => {
	Bytes.equals(bytes1, bytes2);
});

await run();

bench("compare - Voltaire", () => {
	Bytes.compare(bytes1, bytes2);
});

await run();

// ============================================================================
// Type Checking Benchmarks
// ============================================================================

bench("isBytes - valid - Voltaire", () => {
	Bytes.isBytes(bytes1);
});

bench("isBytes - valid - viem", () => {
	viemIsBytes(smallBytes);
});

await run();

bench("isBytes - invalid - Voltaire", () => {
	Bytes.isBytes("not bytes");
});

bench("isBytes - invalid - viem", () => {
	viemIsBytes("not bytes");
});

await run();

// ============================================================================
// Concatenation Benchmarks
// ============================================================================

bench("concat - 2 arrays - Voltaire", () => {
	Bytes.concat(bytes1, bytes1);
});

bench("concat - 2 arrays - viem", () => {
	viemConcat([smallBytes, smallBytes]);
});

await run();

bench("concat - 5 arrays - Voltaire", () => {
	Bytes.concat(bytes1, bytes1, bytes1, bytes1, bytes1);
});

bench("concat - 5 arrays - viem", () => {
	viemConcat([smallBytes, smallBytes, smallBytes, smallBytes, smallBytes]);
});

await run();

// ============================================================================
// Slice Benchmarks
// ============================================================================

bench("slice - start only - Voltaire", () => {
	Bytes.slice(bytes2, 10);
});

bench("slice - start only - viem", () => {
	viemSlice(mediumBytes, 10);
});

await run();

bench("slice - start and end - Voltaire", () => {
	Bytes.slice(bytes2, 10, 50);
});

bench("slice - start and end - viem", () => {
	viemSlice(mediumBytes, 10, 50);
});

await run();

// ============================================================================
// Padding Benchmarks
// ============================================================================

const shortBytes = Bytes.from([1, 2, 3, 4]);

bench("padLeft - Voltaire", () => {
	Bytes.padLeft(shortBytes, 32);
});

bench("pad (left) - viem", () => {
	viemPad(new Uint8Array([1, 2, 3, 4]), { size: 32 });
});

await run();

bench("padRight - Voltaire", () => {
	Bytes.padRight(shortBytes, 32);
});

bench("pad (right) - viem", () => {
	viemPad(new Uint8Array([1, 2, 3, 4]), { size: 32, dir: "right" });
});

await run();

// ============================================================================
// Trim Benchmarks
// ============================================================================

bench("trimLeft - Voltaire", () => {
	Bytes.trimLeft(withLeadingZeros);
});

bench("trim (left) - viem", () => {
	viemTrim(new Uint8Array([0, 0, 0, 0, 1, 2, 3, 4, 5]));
});

await run();

bench("trimRight - Voltaire", () => {
	Bytes.trimRight(withTrailingZeros);
});

bench("trim (right) - viem", () => {
	viemTrim(new Uint8Array([1, 2, 3, 4, 5, 0, 0, 0, 0]), { dir: "right" });
});

await run();

// ============================================================================
// Factory Method Benchmarks
// ============================================================================

bench("zero - 32B - Voltaire", () => {
	Bytes.zero(32);
});

await run();

bench("random - 32B - Voltaire", () => {
	Bytes.random(32);
});

await run();
