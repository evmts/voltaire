/**
 * Int256 Performance Benchmarks - SLICE 2
 *
 * Benchmarks for 256-bit signed integer operations.
 * Compares voltaire implementations.
 */

import { bench, run } from "mitata";
import * as Int256 from "./index.js";

// ============================================================================
// Test Data
// ============================================================================

const MAX = Int256.MAX;
const MIN = Int256.MIN;
const LARGE_POS = Int256.from(2n ** 200n);
const LARGE_NEG = Int256.from(-(2n ** 200n));
const MEDIUM_POS = Int256.from(1n << 128n);
const MEDIUM_NEG = Int256.from(-(1n << 128n));
const SMALL_POS = Int256.from(100n);
const SMALL_NEG = Int256.from(-100n);

const HEX_POS = "0x0000000000000000000000000000000000000000000000000000000000000064";
const HEX_NEG = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff9c"; // -100 in two's complement

// ============================================================================
// Construction: from
// ============================================================================

bench("Int256.from(bigint positive) - voltaire", () => {
	Int256.from(100n);
});

bench("Int256.from(bigint negative) - voltaire", () => {
	Int256.from(-100n);
});

await run();

bench("Int256.from(number positive) - voltaire", () => {
	Int256.from(100);
});

bench("Int256.from(number negative) - voltaire", () => {
	Int256.from(-100);
});

await run();

// ============================================================================
// Construction: fromHex
// ============================================================================

bench("Int256.fromHex - positive - voltaire", () => {
	Int256.fromHex(HEX_POS);
});

bench("Int256.fromHex - negative - voltaire", () => {
	Int256.fromHex(HEX_NEG);
});

await run();

// ============================================================================
// Construction: fromBigInt
// ============================================================================

bench("Int256.fromBigInt - small pos - voltaire", () => {
	Int256.fromBigInt(100n);
});

bench("Int256.fromBigInt - small neg - voltaire", () => {
	Int256.fromBigInt(-100n);
});

bench("Int256.fromBigInt - large pos - voltaire", () => {
	Int256.fromBigInt(2n ** 200n);
});

bench("Int256.fromBigInt - large neg - voltaire", () => {
	Int256.fromBigInt(-(2n ** 200n));
});

await run();

// ============================================================================
// Conversion: toHex
// ============================================================================

bench("Int256.toHex - small pos - voltaire", () => {
	Int256.toHex(SMALL_POS);
});

bench("Int256.toHex - small neg - voltaire", () => {
	Int256.toHex(SMALL_NEG);
});

bench("Int256.toHex - large pos - voltaire", () => {
	Int256.toHex(LARGE_POS);
});

bench("Int256.toHex - large neg - voltaire", () => {
	Int256.toHex(LARGE_NEG);
});

await run();

// ============================================================================
// Conversion: toBigInt
// ============================================================================

bench("Int256.toBigInt - small pos - voltaire", () => {
	Int256.toBigInt(SMALL_POS);
});

bench("Int256.toBigInt - small neg - voltaire", () => {
	Int256.toBigInt(SMALL_NEG);
});

bench("Int256.toBigInt - large pos - voltaire", () => {
	Int256.toBigInt(LARGE_POS);
});

bench("Int256.toBigInt - large neg - voltaire", () => {
	Int256.toBigInt(LARGE_NEG);
});

await run();

// ============================================================================
// Arithmetic: plus
// ============================================================================

bench("Int256.plus - small pos + pos - voltaire", () => {
	Int256.plus(SMALL_POS, SMALL_POS);
});

bench("Int256.plus - small pos + neg - voltaire", () => {
	Int256.plus(SMALL_POS, SMALL_NEG);
});

bench("Int256.plus - large pos + neg - voltaire", () => {
	Int256.plus(LARGE_POS, LARGE_NEG);
});

await run();

// ============================================================================
// Arithmetic: minus
// ============================================================================

bench("Int256.minus - small pos - pos - voltaire", () => {
	Int256.minus(SMALL_POS, SMALL_POS);
});

bench("Int256.minus - small pos - neg - voltaire", () => {
	Int256.minus(SMALL_POS, SMALL_NEG);
});

bench("Int256.minus - large pos - neg - voltaire", () => {
	Int256.minus(LARGE_POS, LARGE_NEG);
});

await run();

// ============================================================================
// Arithmetic: times
// ============================================================================

bench("Int256.times - small pos * pos - voltaire", () => {
	Int256.times(SMALL_POS, SMALL_POS);
});

bench("Int256.times - small pos * neg - voltaire", () => {
	Int256.times(SMALL_POS, SMALL_NEG);
});

bench("Int256.times - medium pos * 2 - voltaire", () => {
	Int256.times(MEDIUM_POS, Int256.from(2n));
});

await run();

// ============================================================================
// Arithmetic: dividedBy
// ============================================================================

bench("Int256.dividedBy - small pos / pos - voltaire", () => {
	Int256.dividedBy(SMALL_POS, Int256.from(10n));
});

bench("Int256.dividedBy - small neg / pos - voltaire", () => {
	Int256.dividedBy(SMALL_NEG, Int256.from(10n));
});

bench("Int256.dividedBy - large pos / small - voltaire", () => {
	Int256.dividedBy(LARGE_POS, Int256.from(1000n));
});

await run();

// ============================================================================
// Arithmetic: modulo
// ============================================================================

bench("Int256.modulo - small pos % pos - voltaire", () => {
	Int256.modulo(SMALL_POS, Int256.from(30n));
});

bench("Int256.modulo - small neg % pos - voltaire", () => {
	Int256.modulo(SMALL_NEG, Int256.from(30n));
});

await run();

// ============================================================================
// Arithmetic: negate
// ============================================================================

bench("Int256.negate - positive - voltaire", () => {
	Int256.negate(SMALL_POS);
});

bench("Int256.negate - negative - voltaire", () => {
	Int256.negate(SMALL_NEG);
});

bench("Int256.negate - large - voltaire", () => {
	Int256.negate(LARGE_POS);
});

await run();

// ============================================================================
// Arithmetic: abs
// ============================================================================

bench("Int256.abs - positive - voltaire", () => {
	Int256.abs(SMALL_POS);
});

bench("Int256.abs - negative - voltaire", () => {
	Int256.abs(SMALL_NEG);
});

bench("Int256.abs - large negative - voltaire", () => {
	Int256.abs(LARGE_NEG);
});

await run();

// ============================================================================
// Comparison: equals
// ============================================================================

bench("Int256.equals - same - voltaire", () => {
	Int256.equals(LARGE_POS, LARGE_POS);
});

bench("Int256.equals - different - voltaire", () => {
	Int256.equals(LARGE_POS, LARGE_NEG);
});

await run();

// ============================================================================
// Comparison: lessThan
// ============================================================================

bench("Int256.lessThan - pos < pos - voltaire", () => {
	Int256.lessThan(SMALL_POS, LARGE_POS);
});

bench("Int256.lessThan - neg < pos - voltaire", () => {
	Int256.lessThan(LARGE_NEG, SMALL_POS);
});

bench("Int256.lessThan - neg < neg - voltaire", () => {
	Int256.lessThan(LARGE_NEG, SMALL_NEG);
});

await run();

// ============================================================================
// Comparison: greaterThan
// ============================================================================

bench("Int256.greaterThan - pos > neg - voltaire", () => {
	Int256.greaterThan(LARGE_POS, LARGE_NEG);
});

bench("Int256.greaterThan - neg > neg - voltaire", () => {
	Int256.greaterThan(SMALL_NEG, LARGE_NEG);
});

await run();

// ============================================================================
// Sign checks
// ============================================================================

bench("Int256.isZero - zero - voltaire", () => {
	Int256.isZero(Int256.ZERO);
});

bench("Int256.isZero - non-zero - voltaire", () => {
	Int256.isZero(SMALL_POS);
});

await run();

bench("Int256.isNegative - positive - voltaire", () => {
	Int256.isNegative(SMALL_POS);
});

bench("Int256.isNegative - negative - voltaire", () => {
	Int256.isNegative(SMALL_NEG);
});

await run();

bench("Int256.isPositive - positive - voltaire", () => {
	Int256.isPositive(SMALL_POS);
});

bench("Int256.isPositive - negative - voltaire", () => {
	Int256.isPositive(SMALL_NEG);
});

await run();

bench("Int256.sign - positive - voltaire", () => {
	Int256.sign(SMALL_POS);
});

bench("Int256.sign - negative - voltaire", () => {
	Int256.sign(SMALL_NEG);
});

bench("Int256.sign - zero - voltaire", () => {
	Int256.sign(Int256.ZERO);
});

await run();

// ============================================================================
// Bitwise: bitwiseAnd
// ============================================================================

const intA = Int256.from(0xffn);
const intB = Int256.from(0x0fn);

bench("Int256.bitwiseAnd - voltaire", () => {
	Int256.bitwiseAnd(intA, intB);
});

await run();

// ============================================================================
// Bitwise: bitwiseOr
// ============================================================================

bench("Int256.bitwiseOr - voltaire", () => {
	Int256.bitwiseOr(intA, intB);
});

await run();

// ============================================================================
// Bitwise: bitwiseXor
// ============================================================================

bench("Int256.bitwiseXor - voltaire", () => {
	Int256.bitwiseXor(intA, intB);
});

await run();

// ============================================================================
// Bitwise: bitwiseNot
// ============================================================================

bench("Int256.bitwiseNot - voltaire", () => {
	Int256.bitwiseNot(intA);
});

await run();

// ============================================================================
// Bitwise: shiftLeft/shiftRight
// ============================================================================

bench("Int256.shiftLeft - 8 bits - voltaire", () => {
	Int256.shiftLeft(MEDIUM_POS, Int256.from(8n));
});

bench("Int256.shiftRight - 8 bits - voltaire", () => {
	Int256.shiftRight(MEDIUM_POS, Int256.from(8n));
});

await run();

// ============================================================================
// Utilities
// ============================================================================

bench("Int256.minimum - voltaire", () => {
	Int256.minimum(LARGE_POS, LARGE_NEG);
});

bench("Int256.maximum - voltaire", () => {
	Int256.maximum(LARGE_POS, LARGE_NEG);
});

await run();

bench("Int256.bitLength - small - voltaire", () => {
	Int256.bitLength(SMALL_POS);
});

bench("Int256.bitLength - large - voltaire", () => {
	Int256.bitLength(LARGE_POS);
});

await run();

bench("Int256.popCount - voltaire", () => {
	Int256.popCount(LARGE_POS);
});

await run();

// ============================================================================
// Round-trip conversions
// ============================================================================

bench("roundtrip bigint->bytes->bigint positive - voltaire", () => {
	Int256.toBigInt(Int256.fromBigInt(2n ** 200n));
});

bench("roundtrip bigint->bytes->bigint negative - voltaire", () => {
	Int256.toBigInt(Int256.fromBigInt(-(2n ** 200n)));
});

await run();

bench("roundtrip hex->bytes->hex positive - voltaire", () => {
	Int256.toHex(Int256.fromHex(HEX_POS));
});

bench("roundtrip hex->bytes->hex negative - voltaire", () => {
	Int256.toHex(Int256.fromHex(HEX_NEG));
});

await run();
