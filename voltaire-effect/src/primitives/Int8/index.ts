/**
 * @module Int8
 * @description Effect Schemas for signed 8-bit integers (-128 to 127).
 *
 * ## Type Declarations
 *
 * ```typescript
 * import * as Int8 from 'voltaire-effect/primitives/Int8'
 *
 * function setTemperature(temp: Int8.Int8Type) {
 *   // ...
 * }
 * ```
 *
 * ## Schemas
 *
 * | Schema | Input | Output | Description |
 * |--------|-------|--------|-------------|
 * | `Int8.String` | string | Int8Type | Decimal string encoding |
 * | `Int8.Number` | number | Int8Type | Number encoding |
 * | `Int8.BigInt` | bigint | Int8Type | BigInt encoding |
 *
 * ## Usage
 *
 * ```typescript
 * import * as Int8 from 'voltaire-effect/primitives/Int8'
 * import * as S from 'effect/Schema'
 *
 * // Decode from string
 * const value = S.decodeSync(Int8.String)('-42')
 *
 * // Decode from number
 * const value2 = S.decodeSync(Int8.Number)(-42)
 *
 * // Encode back
 * const str = S.encodeSync(Int8.String)(value)
 * ```
 *
 * ## Pure Functions
 *
 * ```typescript
 * Int8.add(a, b)      // Int8Type
 * Int8.sub(a, b)      // Int8Type
 * Int8.mul(a, b)      // Int8Type
 * Int8.div(a, b)      // Int8Type
 * Int8.negate(a)      // Int8Type
 * Int8.abs(a)         // Int8Type
 * Int8.equals(a, b)   // boolean
 * Int8.compare(a, b)  // -1 | 0 | 1
 * Int8.isZero(a)      // boolean
 * Int8.isNegative(a)  // boolean
 * ```
 *
 * ## Constants
 *
 * ```typescript
 * Int8.INT8_MIN  // -128
 * Int8.INT8_MAX  // 127
 * ```
 *
 * @since 0.1.0
 */

export { abs } from "./abs.js";
export { BigInt } from "./BigInt.js";
export { compare } from "./compare.js";
// Constants
export { INT8_MAX, INT8_MIN } from "./constants.js";
export { div } from "./div.js";
// Type
export type { Int8Type } from "./Int8Schema.js";
export { isNegative } from "./isNegative.js";
export { isZero } from "./isZero.js";
export { mul } from "./mul.js";
export { Number } from "./Number.js";
export { negate } from "./negate.js";
// Schemas
export { String } from "./String.js";
// Pure functions
export { sub } from "./sub.js";
