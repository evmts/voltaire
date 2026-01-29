/**
 * Benchmark: ModExp (Modular Exponentiation) operations
 * Compares performance of ModExp for various input sizes
 */

import { bench, run } from "mitata";
import { ModExp } from "./index.js";

// Test data - various sizes
const smallBase = 2n;
const smallExp = 10n;
const smallMod = 1000n;

const mediumBase = 0x123456789abcdef0n;
const mediumExp = 0xfedcba9876543210n;
const mediumMod = 0x100000000000000000000000000000000n;

// RSA-style sizes (common in blockchain)
const largeBase = 2n ** 128n + 1n;
const largeExp = 2n ** 64n + 1n;
const largeMod = 2n ** 256n - 189n; // Prime-like

// EIP-198 test vectors
const eip198Base = 0x03n;
const eip198Exp =
	0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2en;
const eip198Mod =
	0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2fn;

// Byte array test data
const baseBytes = new Uint8Array([0x02]);
const expBytes = new Uint8Array([0x0a]);
const modBytes = new Uint8Array([0x03, 0xe8]);

// ============================================================================
// ModExp BigInt API Benchmarks
// ============================================================================

bench("modexp - small values - Voltaire", () => {
	ModExp.modexp(smallBase, smallExp, smallMod);
});

await run();

bench("modexp - medium values - Voltaire", () => {
	ModExp.modexp(mediumBase, mediumExp, mediumMod);
});

await run();

bench("modexp - large values - Voltaire", () => {
	ModExp.modexp(largeBase, largeExp, largeMod);
});

await run();

bench("modexp - EIP-198 secp256k1 - Voltaire", () => {
	ModExp.modexp(eip198Base, eip198Exp, eip198Mod);
});

await run();

// ============================================================================
// ModExp Bytes API Benchmarks
// ============================================================================

bench("modexpBytes - small - Voltaire", () => {
	ModExp.modexpBytes(baseBytes, expBytes, modBytes);
});

await run();

// Large byte arrays
const largeBaseBytes = new Uint8Array(32);
largeBaseBytes[0] = 0x02;
const largeExpBytes = new Uint8Array(32);
largeExpBytes[31] = 0x10;
const largeModBytes = new Uint8Array(32);
largeModBytes.fill(0xff);

bench("modexpBytes - 32-byte inputs - Voltaire", () => {
	ModExp.modexpBytes(largeBaseBytes, largeExpBytes, largeModBytes);
});

await run();

// ============================================================================
// Gas Calculation Benchmarks
// ============================================================================

bench("calculateGas - small - Voltaire", () => {
	ModExp.calculateGas(1n, 1n, 2n, smallExp);
});

bench("calculateGas - medium - Voltaire", () => {
	ModExp.calculateGas(8n, 8n, 16n, mediumExp);
});

bench("calculateGas - large - Voltaire", () => {
	ModExp.calculateGas(32n, 32n, 32n, largeExp);
});

await run();

// ============================================================================
// Edge Cases
// ============================================================================

bench("modexp - base=0 - Voltaire", () => {
	ModExp.modexp(0n, smallExp, smallMod);
});

bench("modexp - exp=0 - Voltaire", () => {
	ModExp.modexp(smallBase, 0n, smallMod);
});

bench("modexp - mod=1 - Voltaire", () => {
	ModExp.modexp(smallBase, smallExp, 1n);
});

await run();
