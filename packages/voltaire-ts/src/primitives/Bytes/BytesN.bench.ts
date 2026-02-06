/**
 * Benchmark: BytesN Fixed-Size Types
 *
 * Tests Bytes1, Bytes2, Bytes4, Bytes8, Bytes16, Bytes32, Bytes64
 * Focuses on from/toHex/equals operations
 */

import { bench, run } from "mitata";
import * as Bytes1 from "./Bytes1/index.js";
import * as Bytes2 from "./Bytes2/index.js";
import * as Bytes4 from "./Bytes4/index.js";
import * as Bytes8 from "./Bytes8/index.js";
import * as Bytes16 from "./Bytes16/index.js";
import * as Bytes32 from "./Bytes32/index.js";
import * as Bytes64 from "./Bytes64/index.js";

// ============================================================================
// Test Data
// ============================================================================

const data1 = new Uint8Array([0xab]);
const data2 = new Uint8Array([0xab, 0xcd]);
const data4 = new Uint8Array([0xab, 0xcd, 0xef, 0x12]);
const data8 = new Uint8Array(8).fill(0xab);
const data16 = new Uint8Array(16).fill(0xcd);
const data32 = new Uint8Array(32).fill(0xef);
const data64 = new Uint8Array(64).fill(0x12);

const hex1 = "0xab";
const hex2 = "0xabcd";
const hex4 = "0xabcdef12";
const hex8 = `0x${"ab".repeat(8)}`;
const hex16 = `0x${"cd".repeat(16)}`;
const hex32 = `0x${"ef".repeat(32)}`;
const hex64 = `0x${"12".repeat(64)}`;

// Pre-create typed instances for comparison
const bytes1A = Bytes1.from(data1);
const bytes1B = Bytes1.from(new Uint8Array([0xab]));
const bytes4A = Bytes4.from(data4);
const bytes4B = Bytes4.from(new Uint8Array([0xab, 0xcd, 0xef, 0x12]));
const bytes32A = Bytes32.from(data32);
const bytes32B = Bytes32.from(new Uint8Array(32).fill(0xef));

// ============================================================================
// Bytes1 Operations
// ============================================================================

bench("Bytes1.from - Uint8Array", () => {
	Bytes1.from(data1);
});

bench("Bytes1.fromHex", () => {
	Bytes1.fromHex(hex1);
});

bench("Bytes1.toHex", () => {
	Bytes1.toHex(bytes1A);
});

bench("Bytes1.equals", () => {
	Bytes1.equals(bytes1A, bytes1B);
});

await run();

// ============================================================================
// Bytes2 Operations
// ============================================================================

const bytes2 = Bytes2.from(data2);

bench("Bytes2.from - Uint8Array", () => {
	Bytes2.from(data2);
});

bench("Bytes2.fromHex", () => {
	Bytes2.fromHex(hex2);
});

bench("Bytes2.toHex", () => {
	Bytes2.toHex(bytes2);
});

await run();

// ============================================================================
// Bytes4 Operations (common for selectors)
// ============================================================================

bench("Bytes4.from - Uint8Array", () => {
	Bytes4.from(data4);
});

bench("Bytes4.fromHex", () => {
	Bytes4.fromHex(hex4);
});

bench("Bytes4.toHex", () => {
	Bytes4.toHex(bytes4A);
});

bench("Bytes4.equals", () => {
	Bytes4.equals(bytes4A, bytes4B);
});

bench("Bytes4.compare", () => {
	Bytes4.compare(bytes4A, bytes4B);
});

await run();

// ============================================================================
// Bytes8 Operations
// ============================================================================

const bytes8 = Bytes8.from(data8);

bench("Bytes8.from - Uint8Array", () => {
	Bytes8.from(data8);
});

bench("Bytes8.fromHex", () => {
	Bytes8.fromHex(hex8);
});

bench("Bytes8.toHex", () => {
	Bytes8.toHex(bytes8);
});

await run();

// ============================================================================
// Bytes16 Operations
// ============================================================================

const bytes16 = Bytes16.from(data16);

bench("Bytes16.from - Uint8Array", () => {
	Bytes16.from(data16);
});

bench("Bytes16.fromHex", () => {
	Bytes16.fromHex(hex16);
});

bench("Bytes16.toHex", () => {
	Bytes16.toHex(bytes16);
});

await run();

// ============================================================================
// Bytes32 Operations (most common - hashes, storage slots)
// ============================================================================

bench("Bytes32.from - Uint8Array", () => {
	Bytes32.from(data32);
});

bench("Bytes32.fromHex", () => {
	Bytes32.fromHex(hex32);
});

bench("Bytes32.toHex", () => {
	Bytes32.toHex(bytes32A);
});

bench("Bytes32.equals", () => {
	Bytes32.equals(bytes32A, bytes32B);
});

bench("Bytes32.compare", () => {
	Bytes32.compare(bytes32A, bytes32B);
});

bench("Bytes32.clone", () => {
	Bytes32.clone(bytes32A);
});

await run();

// ============================================================================
// Bytes64 Operations (signatures)
// ============================================================================

const bytes64 = Bytes64.from(data64);

bench("Bytes64.from - Uint8Array", () => {
	Bytes64.from(data64);
});

bench("Bytes64.fromHex", () => {
	Bytes64.fromHex(hex64);
});

bench("Bytes64.toHex", () => {
	Bytes64.toHex(bytes64);
});

await run();

// ============================================================================
// Cross-size comparisons (throughput)
// ============================================================================

bench("fromHex throughput - Bytes4", () => {
	Bytes4.fromHex(hex4);
	Bytes4.fromHex(hex4);
	Bytes4.fromHex(hex4);
	Bytes4.fromHex(hex4);
});

bench("fromHex throughput - Bytes32", () => {
	Bytes32.fromHex(hex32);
	Bytes32.fromHex(hex32);
	Bytes32.fromHex(hex32);
	Bytes32.fromHex(hex32);
});

bench("toHex throughput - Bytes4", () => {
	Bytes4.toHex(bytes4A);
	Bytes4.toHex(bytes4A);
	Bytes4.toHex(bytes4A);
	Bytes4.toHex(bytes4A);
});

bench("toHex throughput - Bytes32", () => {
	Bytes32.toHex(bytes32A);
	Bytes32.toHex(bytes32A);
	Bytes32.toHex(bytes32A);
	Bytes32.toHex(bytes32A);
});

await run();
