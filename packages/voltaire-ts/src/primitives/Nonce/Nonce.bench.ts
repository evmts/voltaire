/**
 * Nonce Performance Benchmarks - SLICE 2
 *
 * Benchmarks for nonce operations.
 * Nonce is a simple wrapper but increment is commonly used.
 */

import { bench, run } from "mitata";
import * as Nonce from "./index.js";

// ============================================================================
// Test Data
// ============================================================================

const _SMALL_NONCE = 0;
const MEDIUM_NONCE = 1000;
const LARGE_NONCE = 1_000_000;
const _BIGINT_NONCE = 2n ** 64n;

// Pre-created instances
const _nonce0 = Nonce.from(0);
const nonce100 = Nonce.from(100);
const _nonceLarge = Nonce.from(LARGE_NONCE);

// ============================================================================
// Construction: from
// ============================================================================

bench("Nonce.from(number) - voltaire", () => {
	Nonce.from(100);
});

bench("Nonce.from(bigint) - voltaire", () => {
	Nonce.from(100n);
});

bench("Nonce.from(string) - voltaire", () => {
	Nonce.from("100");
});

await run();

bench("Nonce.from(0) - voltaire", () => {
	Nonce.from(0);
});

bench("Nonce.from(large) - voltaire", () => {
	Nonce.from(LARGE_NONCE);
});

await run();

// ============================================================================
// Conversion: toNumber
// ============================================================================

bench("Nonce.toNumber - small - voltaire", () => {
	Nonce.toNumber(0);
});

bench("Nonce.toNumber - medium - voltaire", () => {
	Nonce.toNumber(MEDIUM_NONCE);
});

bench("Nonce.toNumber - large - voltaire", () => {
	Nonce.toNumber(LARGE_NONCE);
});

await run();

// ============================================================================
// Conversion: toBigInt
// ============================================================================

bench("Nonce.toBigInt - small - voltaire", () => {
	Nonce.toBigInt(0);
});

bench("Nonce.toBigInt - large - voltaire", () => {
	Nonce.toBigInt(LARGE_NONCE);
});

await run();

// ============================================================================
// Increment
// ============================================================================

bench("Nonce.increment - from 0 - voltaire", () => {
	Nonce.increment(0);
});

bench("Nonce.increment - from 100 - voltaire", () => {
	Nonce.increment(100);
});

bench("Nonce.increment - from large - voltaire", () => {
	Nonce.increment(LARGE_NONCE);
});

await run();

// ============================================================================
// Internal methods (pre-created nonce)
// ============================================================================

bench("Nonce._toNumber (pre-created) - voltaire", () => {
	Nonce._toNumber.call(nonce100);
});

bench("Nonce._toBigInt (pre-created) - voltaire", () => {
	Nonce._toBigInt.call(nonce100);
});

bench("Nonce._increment (pre-created) - voltaire", () => {
	Nonce._increment.call(nonce100);
});

await run();

// ============================================================================
// Batch operations
// ============================================================================

bench("Batch increment (10 times) - voltaire", () => {
	let n = Nonce.from(0);
	for (let i = 0; i < 10; i++) {
		n = Nonce._increment.call(n);
	}
});

await run();

bench("Batch increment (100 times) - voltaire", () => {
	let n = Nonce.from(0);
	for (let i = 0; i < 100; i++) {
		n = Nonce._increment.call(n);
	}
});

await run();

// ============================================================================
// Round-trip
// ============================================================================

bench("roundtrip number->nonce->number - voltaire", () => {
	Nonce.toNumber(100);
});

bench("roundtrip bigint->nonce->bigint - voltaire", () => {
	Nonce.toBigInt(100n);
});

await run();
