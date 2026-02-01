/**
 * @module Int16
 * @description Effect Schemas for signed 16-bit integers (-32768 to 32767).
 *
 * ## Type Declarations
 *
 * ```typescript
 * import * as Int16 from 'voltaire-effect/primitives/Int16'
 *
 * function setAltitude(meters: Int16.Int16Type) {
 *   // ...
 * }
 * ```
 *
 * ## Schemas
 *
 * | Schema | Input | Output | Description |
 * |--------|-------|--------|-------------|
 * | `Int16.String` | string | Int16Type | Decimal string encoding |
 * | `Int16.Number` | number | Int16Type | Number encoding |
 * | `Int16.BigInt` | bigint | Int16Type | BigInt encoding |
 *
 * ## Usage
 *
 * ```typescript
 * import * as Int16 from 'voltaire-effect/primitives/Int16'
 * import * as S from 'effect/Schema'
 *
 * // Decode from string
 * const value = S.decodeSync(Int16.String)('-1000')
 *
 * // Decode from number
 * const value2 = S.decodeSync(Int16.Number)(-1000)
 *
 * // Encode back
 * const str = S.encodeSync(Int16.String)(value)
 * ```
 *
 * ## Pure Functions
 *
 * ```typescript
 * Int16.add(a, b)      // Int16Type
 * Int16.sub(a, b)      // Int16Type
 * Int16.mul(a, b)      // Int16Type
 * Int16.div(a, b)      // Int16Type
 * Int16.negate(a)      // Int16Type
 * Int16.abs(a)         // Int16Type
 * Int16.equals(a, b)   // boolean
 * Int16.compare(a, b)  // -1 | 0 | 1
 * Int16.isZero(a)      // boolean
 * Int16.isNegative(a)  // boolean
 * ```
 *
 * ## Constants
 *
 * ```typescript
 * Int16.INT16_MIN  // -32768
 * Int16.INT16_MAX  // 32767
 * ```
 *
 * @since 0.1.0
 */

export { abs } from "./abs.js";
export { BigInt } from "./BigInt.js";
export { compare } from "./compare.js";
// Constants
export { INT16_MAX, INT16_MIN } from "./constants.js";
export { div } from "./div.js";
// Type
export type { Int16Type } from "./Int16Schema.js";
export { isNegative } from "./isNegative.js";
export { isZero } from "./isZero.js";
export { mul } from "./mul.js";
export { Number } from "./Number.js";
export { negate } from "./negate.js";
// Schemas
export { String } from "./String.js";
// Pure functions
export { sub } from "./sub.js";
