/**
 * @module Int64
 * @description Effect Schemas for signed 64-bit integers (-2^63 to 2^63-1).
 *
 * ## Type Declarations
 *
 * ```typescript
 * import * as Int64 from 'voltaire-effect/primitives/Int64'
 *
 * function setBalance(balance: Int64.Int64Type) {
 *   // ...
 * }
 * ```
 *
 * ## Schemas
 *
 * | Schema | Input | Output | Description |
 * |--------|-------|--------|-------------|
 * | `Int64.String` | string | Int64Type | Decimal string encoding |
 * | `Int64.Number` | number | Int64Type | Number encoding (may lose precision) |
 * | `Int64.BigInt` | bigint | Int64Type | BigInt encoding (lossless) |
 *
 * ## Usage
 *
 * ```typescript
 * import * as Int64 from 'voltaire-effect/primitives/Int64'
 * import * as S from 'effect/Schema'
 *
 * // Decode from string
 * const value = S.decodeSync(Int64.String)('-9223372036854775808')
 *
 * // Decode from bigint (preferred for large values)
 * const value2 = S.decodeSync(Int64.BigInt)(-9223372036854775808n)
 *
 * // Encode back
 * const str = S.encodeSync(Int64.String)(value)
 * ```
 *
 * ## Pure Functions
 *
 * ```typescript
 * Int64.add(a, b)      // Int64Type
 * Int64.sub(a, b)      // Int64Type
 * Int64.mul(a, b)      // Int64Type
 * Int64.div(a, b)      // Int64Type
 * Int64.negate(a)      // Int64Type
 * Int64.abs(a)         // Int64Type
 * Int64.equals(a, b)   // boolean
 * Int64.compare(a, b)  // -1 | 0 | 1
 * Int64.isZero(a)      // boolean
 * Int64.isNegative(a)  // boolean
 * ```
 *
 * ## Constants
 *
 * ```typescript
 * Int64.INT64_MIN  // -9223372036854775808n
 * Int64.INT64_MAX  // 9223372036854775807n
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
export { INT64_MIN, INT64_MAX } from "./constants.js";

// Type
export type { Int64Type } from "./Int64Schema.js";
