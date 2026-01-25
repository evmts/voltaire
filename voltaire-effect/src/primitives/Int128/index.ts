/**
 * @module Int128
 * @description Effect Schemas for signed 128-bit integers (-2^127 to 2^127-1).
 *
 * ## Type Declarations
 *
 * ```typescript
 * import * as Int128 from 'voltaire-effect/primitives/Int128'
 *
 * function setLiquidity(amount: Int128.Int128Type) {
 *   // ...
 * }
 * ```
 *
 * ## Schemas
 *
 * | Schema | Input | Output | Description |
 * |--------|-------|--------|-------------|
 * | `Int128.String` | string | Int128Type | Decimal string encoding |
 * | `Int128.Number` | number | Int128Type | Number encoding (may lose precision) |
 * | `Int128.BigInt` | bigint | Int128Type | BigInt encoding (lossless) |
 *
 * ## Usage
 *
 * ```typescript
 * import * as Int128 from 'voltaire-effect/primitives/Int128'
 * import * as S from 'effect/Schema'
 *
 * // Decode from string
 * const value = S.decodeSync(Int128.String)('-170141183460469231731687303715884105728')
 *
 * // Decode from bigint (preferred for large values)
 * const value2 = S.decodeSync(Int128.BigInt)(-170141183460469231731687303715884105728n)
 *
 * // Encode back
 * const str = S.encodeSync(Int128.String)(value)
 * ```
 *
 * ## Pure Functions
 *
 * ```typescript
 * Int128.add(a, b)      // Int128Type
 * Int128.sub(a, b)      // Int128Type
 * Int128.mul(a, b)      // Int128Type
 * Int128.div(a, b)      // Int128Type
 * Int128.negate(a)      // Int128Type
 * Int128.abs(a)         // Int128Type
 * Int128.equals(a, b)   // boolean
 * Int128.compare(a, b)  // -1 | 0 | 1
 * Int128.isZero(a)      // boolean
 * Int128.isNegative(a)  // boolean
 * ```
 *
 * ## Constants
 *
 * ```typescript
 * Int128.MIN      // -2^127
 * Int128.MAX      // 2^127-1
 * Int128.ZERO     // 0n
 * Int128.ONE      // 1n
 * Int128.NEG_ONE  // -1n
 * ```
 *
 * @since 0.1.0
 */

// Schemas
export { String } from "./String.js";
export { Number } from "./Number.js";
export { BigInt } from "./BigInt.js";

// Pure functions
export { sub } from "./sub.js";
export { mul } from "./mul.js";
export { div } from "./div.js";
export { negate } from "./negate.js";
export { abs } from "./abs.js";
export { compare } from "./compare.js";
export { isZero } from "./isZero.js";
export { isNegative } from "./isNegative.js";

// Constants
export { MIN, MAX, ZERO, ONE, NEG_ONE } from "./constants.js";

// Type
export type { Int128Type } from "./Int128Schema.js";
