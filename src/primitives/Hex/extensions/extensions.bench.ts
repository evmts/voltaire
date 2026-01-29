/**
 * Benchmark: Hex Extensions (Voltaire-specific functions)
 *
 * Tests xor, zero, isSized, assertSize - functions not in Ox
 */

import { bench, run } from "mitata";
import * as Hex from "../index.js";
import { assertSize } from "./assertSize.js";
import { isSized } from "./isSized.js";
import { xor } from "./xor.js";
import { zero } from "./zero.js";

// ============================================================================
// Test Data
// ============================================================================

const hex32B = Hex.from(`0x${"ab".repeat(32)}`);
const hex64B = Hex.from(`0x${"cd".repeat(64)}`);
const hex256B = Hex.from(`0x${"ef".repeat(256)}`);

const hexA = Hex.from(`0x${"ff".repeat(32)}`);
const hexB = Hex.from(`0x${"0f".repeat(32)}`);

// ============================================================================
// zero - Generate zero-filled hex
// ============================================================================

bench("Hex.zero - 4 bytes", () => {
	zero(4);
});

bench("Hex.zero - 32 bytes", () => {
	zero(32);
});

bench("Hex.zero - 64 bytes", () => {
	zero(64);
});

bench("Hex.zero - 256 bytes", () => {
	zero(256);
});

await run();

// ============================================================================
// isSized - Check hex size
// ============================================================================

bench("Hex.isSized - 32B (match)", () => {
	isSized(hex32B, 32);
});

bench("Hex.isSized - 32B (no match)", () => {
	isSized(hex32B, 64);
});

bench("Hex.isSized - 64B (match)", () => {
	isSized(hex64B, 64);
});

bench("Hex.isSized - 256B (match)", () => {
	isSized(hex256B, 256);
});

await run();

// ============================================================================
// assertSize - Assert hex size (no throw path)
// ============================================================================

bench("Hex.assertSize - 32B (valid)", () => {
	assertSize(hex32B, 32);
});

bench("Hex.assertSize - 64B (valid)", () => {
	assertSize(hex64B, 64);
});

bench("Hex.assertSize - 256B (valid)", () => {
	assertSize(hex256B, 256);
});

await run();

// ============================================================================
// xor - Bitwise XOR
// ============================================================================

bench("Hex.xor - 32 bytes", () => {
	xor(hexA, hexB);
});

const hex64A = Hex.from(`0x${"ff".repeat(64)}`);
const hex64B_xor = Hex.from(`0x${"0f".repeat(64)}`);

bench("Hex.xor - 64 bytes", () => {
	xor(hex64A, hex64B_xor);
});

const hex256A = Hex.from(`0x${"ff".repeat(256)}`);
const hex256B_xor = Hex.from(`0x${"0f".repeat(256)}`);

bench("Hex.xor - 256 bytes", () => {
	xor(hex256A, hex256B_xor);
});

await run();

// ============================================================================
// xor - Different sizes (padded)
// ============================================================================

const hexShort = Hex.from(`0x${"ff".repeat(4)}`);
const hexLong = Hex.from(`0x${"0f".repeat(32)}`);

bench("Hex.xor - mixed sizes (4B vs 32B)", () => {
	xor(hexShort, hexLong);
});

await run();
