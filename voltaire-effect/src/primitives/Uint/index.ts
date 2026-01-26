/**
 * @module Uint
 * @description Effect Schemas for 256-bit unsigned integers (Uint256).
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
 * ## Usage
 *
 * ```typescript
 * import * as Uint from 'voltaire-effect/primitives/Uint'
 * import * as S from 'effect/Schema'
 *
 * // Decode (parse input)
 * const value = S.decodeSync(Uint.BigInt)(1000000000000000000n)
 *
 * // Encode (format output)
 * const bigint = S.encodeSync(Uint.BigInt)(value)
 * const hex = S.encodeSync(Uint.Hex)(value)
 * ```
 *
 * ## Pure Functions
 *
 * Arithmetic, comparison, and bitwise operations are available as pure functions:
 * - `plus`, `minus`, `times`, `dividedBy`, `modulo`
 * - `equals`, `lessThan`, `greaterThan`, `lessThanOrEqual`, `greaterThanOrEqual`
 * - `bitwiseAnd`, `bitwiseOr`, `bitwiseXor`, `bitwiseNot`, `shiftLeft`, `shiftRight`
 * - `min`, `max`, `sum`, `product`, `gcd`, `lcm`
 *
 * @since 0.1.0
 */

// Schemas
export { BigInt } from "./BigInt.js";
export { Bytes } from "./Bytes.js";
// Bit utilities (infallible)
export { bitLength } from "./bitLength.js";
// Bitwise (infallible)
export { bitwiseAnd } from "./bitwiseAnd.js";
export { bitwiseNot } from "./bitwiseNot.js";
export { bitwiseOr } from "./bitwiseOr.js";
export { bitwiseXor } from "./bitwiseXor.js";
export { clone } from "./clone.js";
// Arithmetic (failable - division by zero)
// Comparison (infallible)
export { equals } from "./equals.js";
// Math utilities (infallible)
export { gcd } from "./gcd.js";
export { greaterThan } from "./greaterThan.js";
export { greaterThanOrEqual } from "./greaterThanOrEqual.js";
export { Hex } from "./Hex.js";
export { isPowerOf2 } from "./isPowerOf2.js";
export { isZero } from "./isZero.js";
export { lcm } from "./lcm.js";
export { leadingZeros } from "./leadingZeros.js";
export { lessThan } from "./lessThan.js";
export { lessThanOrEqual } from "./lessThanOrEqual.js";
export { max } from "./max.js";
export { maximum } from "./maximum.js";
export { min } from "./min.js";
// Min/Max (infallible)
export { minimum } from "./minimum.js";
export { minus } from "./minus.js";
export { Number } from "./Number.js";
export { notEquals } from "./notEquals.js";
// Arithmetic (wrapping, infallible)
export { plus } from "./plus.js";
export { popCount } from "./popCount.js";
export { product } from "./product.js";
export { String } from "./String.js";
export { shiftLeft } from "./shiftLeft.js";
export { shiftRight } from "./shiftRight.js";
// Aggregate (infallible)
export { sum } from "./sum.js";
export { times } from "./times.js";
export { toAbiEncoded } from "./toAbiEncoded.js";
// Converters (infallible)
export { toPower } from "./toPower.js";
