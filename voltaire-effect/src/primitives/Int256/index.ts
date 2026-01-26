/**
 * @module Int256
 * @description Effect Schemas for signed 256-bit integers (-2^255 to 2^255-1).
 *
 * This is the native signed integer type used in Solidity smart contracts (int256).
 *
 * ## Type Declarations
 *
 * ```typescript
 * import * as Int256 from 'voltaire-effect/primitives/Int256'
 *
 * function setDelta(delta: Int256.Int256Type) {
 *   // ...
 * }
 * ```
 *
 * ## Schemas
 *
 * | Schema | Input | Output | Description |
 * |--------|-------|--------|-------------|
 * | `Int256.String` | string | Int256Type | Decimal string encoding |
 * | `Int256.Number` | number | Int256Type | Number encoding (may lose precision) |
 * | `Int256.BigInt` | bigint | Int256Type | BigInt encoding (lossless) |
 *
 * ## Usage
 *
 * ```typescript
 * import * as Int256 from 'voltaire-effect/primitives/Int256'
 * import * as S from 'effect/Schema'
 *
 * // Decode from string
 * const value = S.decodeSync(Int256.String)('-12345678901234567890123456789')
 *
 * // Decode from bigint (preferred for large values)
 * const value2 = S.decodeSync(Int256.BigInt)(-12345678901234567890123456789n)
 *
 * // Encode back
 * const str = S.encodeSync(Int256.String)(value)
 * ```
 *
 * ## Pure Functions
 *
 * ```typescript
 * Int256.add(a, b)      // Int256Type
 * Int256.sub(a, b)      // Int256Type
 * Int256.mul(a, b)      // Int256Type
 * Int256.div(a, b)      // Int256Type
 * Int256.negate(a)      // Int256Type
 * Int256.abs(a)         // Int256Type
 * Int256.equals(a, b)   // boolean
 * Int256.compare(a, b)  // -1 | 0 | 1
 * Int256.isZero(a)      // boolean
 * Int256.isNegative(a)  // boolean
 * ```
 *
 * ## Constants
 *
 * ```typescript
 * Int256.MIN      // -2^255
 * Int256.MAX      // 2^255-1
 * Int256.ZERO     // 0n
 * Int256.ONE      // 1n
 * Int256.NEG_ONE  // -1n
 * ```
 *
 * @since 0.1.0
 */

// Schemas
export { String } from "./String.js";
export { Number } from "./Number.js";
export { BigInt } from "./BigInt.js";

// Pure functions
export { add } from "./add.js";
export { sub } from "./sub.js";
export { mul } from "./mul.js";
export { div } from "./div.js";
export { negate } from "./negate.js";
export { abs } from "./abs.js";
export { compare } from "./compare.js";
export { equals } from "./equals.js";
export { isZero } from "./isZero.js";
export { isNegative } from "./isNegative.js";

// Constants
export { MIN, MAX, ZERO, ONE, NEG_ONE } from "./constants.js";

// Type
export type { Int256Type } from "./Int256Schema.js";
