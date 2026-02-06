/**
 * SSZ (Simple Serialize) Benchmarks - mitata format
 * Ethereum consensus layer serialization
 */

import { bench, run } from "mitata";
import * as Ssz from "./index.js";

// ============================================================================
// Test Data
// ============================================================================

const smallUint8 = 42;
const maxUint8 = 255;
const smallUint16 = 0x1234;
const maxUint16 = 0xffff;
const smallUint32 = 0x12345678;
const maxUint32 = 0xffffffff;
const smallUint64 = 0x123456789abcdefn;
const maxUint64 = 0xffffffffffffffffn;
const smallUint256 = 0xdeadbeefcafebaben;
const maxUint256 =
	0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn;

// Pre-encoded data for decode benchmarks
const encodedUint8 = Ssz.encodeBasic(smallUint8, "uint8");
const encodedUint16 = Ssz.encodeBasic(smallUint16, "uint16");
const encodedUint32 = Ssz.encodeBasic(smallUint32, "uint32");
const encodedUint64 = Ssz.encodeBasic(smallUint64, "uint64");
const encodedUint256 = Ssz.encodeBasic(smallUint256, "uint256");
const encodedBool = Ssz.encodeBasic(true, "bool");

// Data for hashTreeRoot
const smallData = new Uint8Array(16).fill(0x42);
const mediumData = new Uint8Array(256).fill(0xab);
const largeData = new Uint8Array(4096).fill(0xcd);

// ============================================================================
// encode uint8
// ============================================================================

bench("SSZ encodeBasic(uint8) - small", () => {
	Ssz.encodeBasic(smallUint8, "uint8");
});

bench("SSZ encodeBasic(uint8) - max", () => {
	Ssz.encodeBasic(maxUint8, "uint8");
});

await run();

// ============================================================================
// encode uint16
// ============================================================================

bench("SSZ encodeBasic(uint16) - small", () => {
	Ssz.encodeBasic(smallUint16, "uint16");
});

bench("SSZ encodeBasic(uint16) - max", () => {
	Ssz.encodeBasic(maxUint16, "uint16");
});

await run();

// ============================================================================
// encode uint32
// ============================================================================

bench("SSZ encodeBasic(uint32) - small", () => {
	Ssz.encodeBasic(smallUint32, "uint32");
});

bench("SSZ encodeBasic(uint32) - max", () => {
	Ssz.encodeBasic(maxUint32, "uint32");
});

await run();

// ============================================================================
// encode uint64
// ============================================================================

bench("SSZ encodeBasic(uint64) - small", () => {
	Ssz.encodeBasic(smallUint64, "uint64");
});

bench("SSZ encodeBasic(uint64) - max", () => {
	Ssz.encodeBasic(maxUint64, "uint64");
});

await run();

// ============================================================================
// encode uint256
// ============================================================================

bench("SSZ encodeBasic(uint256) - small", () => {
	Ssz.encodeBasic(smallUint256, "uint256");
});

bench("SSZ encodeBasic(uint256) - max", () => {
	Ssz.encodeBasic(maxUint256, "uint256");
});

await run();

// ============================================================================
// encode bool
// ============================================================================

bench("SSZ encodeBasic(bool) - true", () => {
	Ssz.encodeBasic(true, "bool");
});

bench("SSZ encodeBasic(bool) - false", () => {
	Ssz.encodeBasic(false, "bool");
});

await run();

// ============================================================================
// decode uint8
// ============================================================================

bench("SSZ decodeBasic(uint8)", () => {
	Ssz.decodeBasic(encodedUint8, "uint8");
});

await run();

// ============================================================================
// decode uint16
// ============================================================================

bench("SSZ decodeBasic(uint16)", () => {
	Ssz.decodeBasic(encodedUint16, "uint16");
});

await run();

// ============================================================================
// decode uint32
// ============================================================================

bench("SSZ decodeBasic(uint32)", () => {
	Ssz.decodeBasic(encodedUint32, "uint32");
});

await run();

// ============================================================================
// decode uint64
// ============================================================================

bench("SSZ decodeBasic(uint64)", () => {
	Ssz.decodeBasic(encodedUint64, "uint64");
});

await run();

// ============================================================================
// decode uint256
// ============================================================================

bench("SSZ decodeBasic(uint256)", () => {
	Ssz.decodeBasic(encodedUint256, "uint256");
});

await run();

// ============================================================================
// decode bool
// ============================================================================

bench("SSZ decodeBasic(bool)", () => {
	Ssz.decodeBasic(encodedBool, "bool");
});

await run();

// ============================================================================
// round-trip operations
// ============================================================================

bench("SSZ roundtrip uint8", () => {
	const encoded = Ssz.encodeBasic(smallUint8, "uint8");
	Ssz.decodeBasic(encoded, "uint8");
});

bench("SSZ roundtrip uint64", () => {
	const encoded = Ssz.encodeBasic(smallUint64, "uint64");
	Ssz.decodeBasic(encoded, "uint64");
});

bench("SSZ roundtrip uint256", () => {
	const encoded = Ssz.encodeBasic(smallUint256, "uint256");
	Ssz.decodeBasic(encoded, "uint256");
});

await run();

// ============================================================================
// hashTreeRoot
// ============================================================================

bench("SSZ hashTreeRoot - 16 bytes", async () => {
	await Ssz.hashTreeRoot(smallData);
});

await run();

bench("SSZ hashTreeRoot - 256 bytes", async () => {
	await Ssz.hashTreeRoot(mediumData);
});

await run();

bench("SSZ hashTreeRoot - 4KB", async () => {
	await Ssz.hashTreeRoot(largeData);
});

await run();
