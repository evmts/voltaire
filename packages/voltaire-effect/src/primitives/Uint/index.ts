/**
 * @module Uint
 * @description Effect wrappers for 256-bit unsigned integers (Uint256).
 *
 * ## Schemas
 *
 * | Schema | Input | Output |
 * |--------|-------|--------|
 * | `Uint.String` | decimal string | Uint256Type |
 * | `Uint.Number` | number | Uint256Type |
 * | `Uint.BigInt` | bigint | Uint256Type |
 * | `Uint.Hex` | hex string | Uint256Type |
 * | `Uint.Bytes` | Uint8Array | Uint256Type |
 *
 * ## Constructors (Effect-wrapped)
 *
 * - `from`, `fromBigInt`, `fromNumber`, `fromHex`, `fromBytes`, `fromAbiEncoded`
 * - `tryFrom` (returns Option)
 *
 * ## Type Guards (pure)
 *
 * - `isUint256`, `isValid`
 *
 * ## Arithmetic (pure, wrapping)
 *
 * - `plus`, `minus`, `times`, `toPower`
 *
 * ## Arithmetic (Effect-wrapped, can fail)
 *
 * - `dividedBy`, `modulo` (division by zero)
 *
 * ## Bitwise (pure)
 *
 * - `bitwiseAnd`, `bitwiseOr`, `bitwiseXor`, `bitwiseNot`, `shiftLeft`, `shiftRight`
 *
 * ## Comparison (pure)
 *
 * - `equals`, `notEquals`, `lessThan`, `lessThanOrEqual`, `greaterThan`, `greaterThanOrEqual`, `isZero`
 *
 * ## Bit utilities (pure)
 *
 * - `bitLength`, `leadingZeros`, `popCount`, `isPowerOf2`
 *
 * ## Math utilities
 *
 * - `gcd`, `lcm`, `clone`
 * - `min`, `max`, `minimum`, `maximum`, `sum`, `product` (Effect-wrapped)
 *
 * ## Converters (Effect-wrapped)
 *
 * - `toBigInt`, `toNumber`, `toHex`, `toBytes`, `toAbiEncoded`, `toString`
 *
 * @since 0.1.0
 */

// Schemas
export { BigInt } from "./BigInt.js";
export { Bytes } from "./Bytes.js";
export { Hex } from "./Hex.js";
export { Number } from "./Number.js";
export { String } from "./String.js";

// Constructors (fallible)
export { from } from "./from.js";
export { fromAbiEncoded } from "./fromAbiEncoded.js";
export { fromBigInt } from "./fromBigInt.js";
export { fromBytes } from "./fromBytes.js";
export { fromHex } from "./fromHex.js";
export { fromNumber } from "./fromNumber.js";
export { tryFrom } from "./tryFrom.js";

// Type guards (pure)
export { isUint256 } from "./isUint256.js";
export { isValid } from "./isValid.js";

// Bit utilities (pure)
export { bitLength } from "./bitLength.js";
export { leadingZeros } from "./leadingZeros.js";
export { popCount } from "./popCount.js";
export { isPowerOf2 } from "./isPowerOf2.js";

// Bitwise (pure)
export { bitwiseAnd } from "./bitwiseAnd.js";
export { bitwiseNot } from "./bitwiseNot.js";
export { bitwiseOr } from "./bitwiseOr.js";
export { bitwiseXor } from "./bitwiseXor.js";
export { shiftLeft } from "./shiftLeft.js";
export { shiftRight } from "./shiftRight.js";

// Comparison (pure)
export { equals } from "./equals.js";
export { notEquals } from "./notEquals.js";
export { lessThan } from "./lessThan.js";
export { lessThanOrEqual } from "./lessThanOrEqual.js";
export { greaterThan } from "./greaterThan.js";
export { greaterThanOrEqual } from "./greaterThanOrEqual.js";
export { isZero } from "./isZero.js";

// Arithmetic (wrapping, pure)
export { plus } from "./plus.js";
export { minus } from "./minus.js";
export { times } from "./times.js";
export { toPower } from "./toPower.js";

// Arithmetic (fallible - division by zero)
export { dividedBy } from "./dividedBy.js";
export { modulo } from "./modulo.js";

// Math utilities (pure)
export { gcd } from "./gcd.js";
export { lcm } from "./lcm.js";
export { clone } from "./clone.js";

// Min/Max (Effect-wrapped)
export { min } from "./min.js";
export { max } from "./max.js";
export { minimum } from "./minimum.js";
export { maximum } from "./maximum.js";

// Aggregate (Effect-wrapped)
export { sum } from "./sum.js";
export { product } from "./product.js";

// Converters (Effect-wrapped)
export { toAbiEncoded } from "./toAbiEncoded.js";
export { toBigInt } from "./toBigInt.js";
export { toBytes } from "./toBytes.js";
export { toHex } from "./toHex.js";
export { toNumber } from "./toNumber.js";
export { toString } from "./toString.js";
