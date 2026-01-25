/**
 * @module Int32
 * @description Effect Schemas for signed 32-bit integers (-2147483648 to 2147483647).
 *
 * ## Schemas
 *
 * | Schema | Input | Output | Description |
 * |--------|-------|--------|-------------|
 * | `Int32.String` | string | Int32Type | Decimal string encoding |
 * | `Int32.Number` | number | Int32Type | Number encoding |
 * | `Int32.BigInt` | bigint | Int32Type | BigInt encoding |
 *
 * ## Usage
 *
 * ```typescript
 * import * as Int32 from 'voltaire-effect/primitives/Int32'
 * import * as S from 'effect/Schema'
 *
 * // Decode from string
 * const value = S.decodeSync(Int32.String)('-1000000')
 *
 * // Decode from number
 * const value2 = S.decodeSync(Int32.Number)(-1000000)
 *
 * // Encode back
 * const str = S.encodeSync(Int32.String)(value)
 * ```
 *
 * ## Pure Functions
 *
 * ```typescript
 * Int32.add(a, b)      // Int32Type
 * Int32.sub(a, b)      // Int32Type
 * Int32.mul(a, b)      // Int32Type
 * Int32.div(a, b)      // Int32Type
 * Int32.negate(a)      // Int32Type
 * Int32.abs(a)         // Int32Type
 * Int32.equals(a, b)   // boolean
 * Int32.compare(a, b)  // -1 | 0 | 1
 * Int32.isZero(a)      // boolean
 * Int32.isNegative(a)  // boolean
 * ```
 *
 * ## Constants
 *
 * ```typescript
 * Int32.INT32_MIN  // -2147483648
 * Int32.INT32_MAX  // 2147483647
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
export { INT32_MIN, INT32_MAX } from "./constants.js";

// Type
export type { Int32Type } from "./Int32Schema.js";
