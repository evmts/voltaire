/**
 * Uint256 Performance Benchmarks - SLICE 2
 *
 * Compares performance across implementations:
 * - voltaire (default JS)
 * - voltaire/wasm
 * - voltaire-effect (Effect wrappers)
 * - viem (reference)
 */

import { bench, run } from "mitata";
import * as loader from "../../wasm-loader/loader.js";
import * as Uint from "./index.js";
import * as UintWasm from "./Uint256.wasm.js";

// voltaire-effect re-exports same functions, pure functions have no Effect overhead
import * as UintEffect from "../../../voltaire-effect/src/primitives/Uint/index.js";
import * as Effect from "effect/Effect";

// Initialize WASM
await loader.loadWasm(
	new URL("../../../wasm/primitives.wasm", import.meta.url),
);

// ============================================================================
// Test Data
// ============================================================================

const MAX_U256 = 2n ** 256n - 1n;
const LARGE_VALUE = MAX_U256 - 1000n;
const MEDIUM_VALUE = 1n << 128n;
const SMALL_VALUE = 100n;

const HEX_MAX =
	"0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
const HEX_LARGE =
	"0x742d35cc6634c0532925a3b844bc9e7595f251e3742d35cc6634c0532925a3b8";
const HEX_SMALL =
	"0x0000000000000000000000000000000000000000000000000000000000000064";

// Pre-created values
const tsSmall = Uint.from(SMALL_VALUE);
const tsMedium = Uint.from(MEDIUM_VALUE);
const tsLarge = Uint.from(LARGE_VALUE);
const tsMax = Uint.MAX;

const wasmSmall = UintWasm.u256FromBigInt(SMALL_VALUE);
const wasmMedium = UintWasm.u256FromBigInt(MEDIUM_VALUE);
const wasmLarge = UintWasm.u256FromBigInt(LARGE_VALUE);
const wasmMax = UintWasm.u256FromBigInt(MAX_U256);

// ============================================================================
// Construction: from
// ============================================================================

bench("Uint.from(bigint) - voltaire", () => {
	Uint.from(SMALL_VALUE);
});

bench("Uint.from(bigint) - voltaire-effect", () => {
	Effect.runSync(UintEffect.from(SMALL_VALUE));
});

await run();

bench("Uint.from(hex) - voltaire", () => {
	Uint.from(HEX_SMALL);
});

bench("Uint.from(hex) - voltaire-effect", () => {
	Effect.runSync(UintEffect.from(HEX_SMALL));
});

await run();

// ============================================================================
// Construction: fromHex
// ============================================================================

bench("Uint.fromHex - small - voltaire", () => {
	Uint.fromHex(HEX_SMALL);
});

bench("Uint.fromHex - small - wasm", () => {
	UintWasm.u256FromHex(HEX_SMALL);
});

bench("Uint.fromHex - small - voltaire-effect", () => {
	Effect.runSync(UintEffect.fromHex(HEX_SMALL));
});

await run();

bench("Uint.fromHex - large - voltaire", () => {
	Uint.fromHex(HEX_LARGE);
});

bench("Uint.fromHex - large - wasm", () => {
	UintWasm.u256FromHex(HEX_LARGE);
});

bench("Uint.fromHex - large - voltaire-effect", () => {
	Effect.runSync(UintEffect.fromHex(HEX_LARGE));
});

await run();

bench("Uint.fromHex - max - voltaire", () => {
	Uint.fromHex(HEX_MAX);
});

bench("Uint.fromHex - max - wasm", () => {
	UintWasm.u256FromHex(HEX_MAX);
});

await run();

// ============================================================================
// Construction: fromBigInt
// ============================================================================

bench("Uint.fromBigInt - small - voltaire", () => {
	Uint.fromBigInt(SMALL_VALUE);
});

bench("Uint.fromBigInt - small - wasm", () => {
	UintWasm.u256FromBigInt(SMALL_VALUE);
});

bench("Uint.fromBigInt - small - voltaire-effect", () => {
	Effect.runSync(UintEffect.fromBigInt(SMALL_VALUE));
});

await run();

bench("Uint.fromBigInt - large - voltaire", () => {
	Uint.fromBigInt(LARGE_VALUE);
});

bench("Uint.fromBigInt - large - wasm", () => {
	UintWasm.u256FromBigInt(LARGE_VALUE);
});

bench("Uint.fromBigInt - large - voltaire-effect", () => {
	Effect.runSync(UintEffect.fromBigInt(LARGE_VALUE));
});

await run();

// ============================================================================
// Conversion: toHex
// ============================================================================

bench("Uint.toHex - small - voltaire", () => {
	Uint.toHex(tsSmall);
});

bench("Uint.toHex - small - wasm", () => {
	UintWasm.u256ToHex(wasmSmall);
});

bench("Uint.toHex - small - voltaire-effect", () => {
	UintEffect.toHex(tsSmall);
});

await run();

bench("Uint.toHex - large - voltaire", () => {
	Uint.toHex(tsLarge);
});

bench("Uint.toHex - large - wasm", () => {
	UintWasm.u256ToHex(wasmLarge);
});

bench("Uint.toHex - large - voltaire-effect", () => {
	UintEffect.toHex(tsLarge);
});

await run();

// ============================================================================
// Conversion: toBigInt
// ============================================================================

bench("Uint.toBigInt - small - voltaire", () => {
	Uint.toBigInt(tsSmall);
});

bench("Uint.toBigInt - small - wasm", () => {
	UintWasm.u256ToBigInt(wasmSmall);
});

bench("Uint.toBigInt - small - voltaire-effect", () => {
	UintEffect.toBigInt(tsSmall);
});

await run();

bench("Uint.toBigInt - large - voltaire", () => {
	Uint.toBigInt(tsLarge);
});

bench("Uint.toBigInt - large - wasm", () => {
	UintWasm.u256ToBigInt(wasmLarge);
});

bench("Uint.toBigInt - large - voltaire-effect", () => {
	UintEffect.toBigInt(tsLarge);
});

await run();

// ============================================================================
// Arithmetic: plus
// ============================================================================

bench("Uint.plus - small - voltaire", () => {
	Uint.plus(tsSmall, tsSmall);
});

bench("Uint.plus - small - voltaire-effect", () => {
	UintEffect.plus(tsSmall, tsSmall);
});

await run();

bench("Uint.plus - large - voltaire", () => {
	Uint.plus(tsLarge, tsMedium);
});

bench("Uint.plus - large - voltaire-effect", () => {
	UintEffect.plus(tsLarge, tsMedium);
});

await run();

// ============================================================================
// Arithmetic: minus
// ============================================================================

bench("Uint.minus - small - voltaire", () => {
	Uint.minus(tsSmall, Uint.from(50n));
});

bench("Uint.minus - small - voltaire-effect", () => {
	UintEffect.minus(tsSmall, Uint.from(50n));
});

await run();

bench("Uint.minus - large - voltaire", () => {
	Uint.minus(tsLarge, tsMedium);
});

bench("Uint.minus - large - voltaire-effect", () => {
	UintEffect.minus(tsLarge, tsMedium);
});

await run();

// ============================================================================
// Arithmetic: times
// ============================================================================

bench("Uint.times - small - voltaire", () => {
	Uint.times(tsSmall, Uint.from(2n));
});

bench("Uint.times - small - voltaire-effect", () => {
	UintEffect.times(tsSmall, Uint.from(2n));
});

await run();

bench("Uint.times - large - voltaire", () => {
	Uint.times(tsLarge, Uint.from(2n));
});

bench("Uint.times - large - voltaire-effect", () => {
	UintEffect.times(tsLarge, Uint.from(2n));
});

await run();

// ============================================================================
// Arithmetic: dividedBy
// ============================================================================

bench("Uint.dividedBy - small - voltaire", () => {
	Uint.dividedBy(tsSmall, Uint.from(10n));
});

bench("Uint.dividedBy - small - voltaire-effect", () => {
	Effect.runSync(UintEffect.dividedBy(tsSmall, Uint.from(10n)));
});

await run();

bench("Uint.dividedBy - large - voltaire", () => {
	Uint.dividedBy(tsLarge, Uint.from(1000n));
});

bench("Uint.dividedBy - large - voltaire-effect", () => {
	Effect.runSync(UintEffect.dividedBy(tsLarge, Uint.from(1000n)));
});

await run();

// ============================================================================
// Arithmetic: modulo
// ============================================================================

bench("Uint.modulo - small - voltaire", () => {
	Uint.modulo(tsSmall, Uint.from(30n));
});

bench("Uint.modulo - small - voltaire-effect", () => {
	Effect.runSync(UintEffect.modulo(tsSmall, Uint.from(30n)));
});

await run();

// ============================================================================
// Comparison: equals
// ============================================================================

bench("Uint.equals - voltaire", () => {
	Uint.equals(tsLarge, tsLarge);
});

bench("Uint.equals - voltaire-effect", () => {
	UintEffect.equals(tsLarge, tsLarge);
});

await run();

// ============================================================================
// Comparison: lessThan
// ============================================================================

bench("Uint.lessThan - voltaire", () => {
	Uint.lessThan(tsMedium, tsLarge);
});

bench("Uint.lessThan - voltaire-effect", () => {
	UintEffect.lessThan(tsMedium, tsLarge);
});

await run();

// ============================================================================
// Comparison: greaterThan
// ============================================================================

bench("Uint.greaterThan - voltaire", () => {
	Uint.greaterThan(tsLarge, tsMedium);
});

bench("Uint.greaterThan - voltaire-effect", () => {
	UintEffect.greaterThan(tsLarge, tsMedium);
});

await run();

// ============================================================================
// Bitwise: bitwiseAnd
// ============================================================================

const tsA = Uint.from(0xffn);
const tsB = Uint.from(0x0fn);

bench("Uint.bitwiseAnd - voltaire", () => {
	Uint.bitwiseAnd(tsA, tsB);
});

bench("Uint.bitwiseAnd - voltaire-effect", () => {
	UintEffect.bitwiseAnd(tsA, tsB);
});

await run();

// ============================================================================
// Bitwise: bitwiseOr
// ============================================================================

bench("Uint.bitwiseOr - voltaire", () => {
	Uint.bitwiseOr(tsA, tsB);
});

bench("Uint.bitwiseOr - voltaire-effect", () => {
	UintEffect.bitwiseOr(tsA, tsB);
});

await run();

// ============================================================================
// Bitwise: bitwiseXor
// ============================================================================

bench("Uint.bitwiseXor - voltaire", () => {
	Uint.bitwiseXor(tsA, tsB);
});

bench("Uint.bitwiseXor - voltaire-effect", () => {
	UintEffect.bitwiseXor(tsA, tsB);
});

await run();

// ============================================================================
// Bitwise: bitwiseNot
// ============================================================================

bench("Uint.bitwiseNot - voltaire", () => {
	Uint.bitwiseNot(tsA);
});

bench("Uint.bitwiseNot - voltaire-effect", () => {
	UintEffect.bitwiseNot(tsA);
});

await run();

// ============================================================================
// Bitwise: shiftLeft/shiftRight
// ============================================================================

bench("Uint.shiftLeft - 8 bits - voltaire", () => {
	Uint.shiftLeft(tsLarge, Uint.from(8n));
});

bench("Uint.shiftLeft - 8 bits - voltaire-effect", () => {
	UintEffect.shiftLeft(tsLarge, Uint.from(8n));
});

await run();

bench("Uint.shiftRight - 8 bits - voltaire", () => {
	Uint.shiftRight(tsLarge, Uint.from(8n));
});

bench("Uint.shiftRight - 8 bits - voltaire-effect", () => {
	UintEffect.shiftRight(tsLarge, Uint.from(8n));
});

await run();

// ============================================================================
// Utilities: isZero
// ============================================================================

bench("Uint.isZero - voltaire", () => {
	Uint.isZero(tsSmall);
});

bench("Uint.isZero - voltaire-effect", () => {
	UintEffect.isZero(tsSmall);
});

await run();

// ============================================================================
// Utilities: bitLength
// ============================================================================

bench("Uint.bitLength - small - voltaire", () => {
	Uint.bitLength(tsSmall);
});

bench("Uint.bitLength - small - voltaire-effect", () => {
	UintEffect.bitLength(tsSmall);
});

await run();

bench("Uint.bitLength - large - voltaire", () => {
	Uint.bitLength(tsLarge);
});

bench("Uint.bitLength - large - voltaire-effect", () => {
	UintEffect.bitLength(tsLarge);
});

await run();

// ============================================================================
// Utilities: popCount
// ============================================================================

bench("Uint.popCount - voltaire", () => {
	Uint.popCount(tsLarge);
});

bench("Uint.popCount - voltaire-effect", () => {
	UintEffect.popCount(tsLarge);
});

await run();

// ============================================================================
// Round-trip conversions
// ============================================================================

bench("roundtrip hex->bytes->hex - voltaire", () => {
	Uint.toHex(Uint.fromHex(HEX_LARGE));
});

bench("roundtrip hex->bytes->hex - wasm", () => {
	UintWasm.u256ToHex(UintWasm.u256FromHex(HEX_LARGE));
});

await run();

bench("roundtrip bigint->bytes->bigint - voltaire", () => {
	Uint.toBigInt(Uint.fromBigInt(LARGE_VALUE));
});

bench("roundtrip bigint->bytes->bigint - wasm", () => {
	UintWasm.u256ToBigInt(UintWasm.u256FromBigInt(LARGE_VALUE));
});

await run();
