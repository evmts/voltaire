/**
 * @fileoverview Int32 module for working with signed 32-bit integers in Effect.
 *
 * @description
 * Provides type-safe arithmetic operations with overflow checking for signed
 * 32-bit integers. Values are constrained to the range -2147483648 to 2147483647 (inclusive).
 *
 * Key features:
 * - Type-safe branded Int32 values
 * - Effect-based error handling for overflow/underflow
 * - Schema validation for parsing from various input types
 * - Arithmetic operations: plus, minus, times
 * - Conversion utilities: toNumber, toBigInt, toHex
 *
 * @example
 * ```typescript
 * import * as Int32 from 'voltaire-effect/Int32'
 * import * as Effect from 'effect/Effect'
 *
 * // Create Int32 values
 * const a = Effect.runSync(Int32.from(1000000))
 * const b = Effect.runSync(Int32.from(500000))
 *
 * // Arithmetic operations
 * const sum = Effect.runSync(Int32.plus(a, b))   // 1500000
 * const diff = Effect.runSync(Int32.minus(a, b)) // 500000
 *
 * // Constants
 * console.log(Int32.INT32_MIN) // -2147483648
 * console.log(Int32.INT32_MAX) // 2147483647
 * ```
 *
 * @since 0.0.1
 * @module Int32
 * @see {@link Int16} for 16-bit signed integers
 * @see {@link Int64} for 64-bit signed integers
 * @see {@link Int128} for 128-bit signed integers
 */
export { Schema, type Int32Type } from './Int32Schema.js'
export {
  from,
  fromHex,
  fromBytes,
  plus,
  add,
  minus,
  sub,
  times,
  mul,
  div,
  neg,
  abs,
  toNumber,
  toBigInt,
  toHex,
  toBytes,
  equals,
  compare,
  isNegative,
  isZero,
  Int32Error,
  INT32_MIN,
  INT32_MAX
} from './from.js'
