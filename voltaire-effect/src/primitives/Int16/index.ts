/**
 * @fileoverview Int16 module for working with signed 16-bit integers in Effect.
 *
 * @description
 * Provides type-safe arithmetic operations with overflow checking for signed
 * 16-bit integers. Values are constrained to the range -32768 to 32767 (inclusive).
 *
 * Key features:
 * - Type-safe branded Int16 values
 * - Effect-based error handling for overflow/underflow
 * - Schema validation for parsing from various input types
 * - Arithmetic operations: plus, minus, times
 * - Conversion utilities: toNumber, toHex
 *
 * @example
 * ```typescript
 * import * as Int16 from 'voltaire-effect/Int16'
 * import * as Effect from 'effect/Effect'
 *
 * // Create Int16 values
 * const a = Effect.runSync(Int16.from(1000))
 * const b = Effect.runSync(Int16.from(500))
 *
 * // Arithmetic operations
 * const sum = Effect.runSync(Int16.plus(a, b))   // 1500
 * const diff = Effect.runSync(Int16.minus(a, b)) // 500
 *
 * // Constants
 * console.log(Int16.INT16_MIN) // -32768
 * console.log(Int16.INT16_MAX) // 32767
 * ```
 *
 * @since 0.0.1
 * @module Int16
 * @see {@link Int8} for 8-bit signed integers
 * @see {@link Int32} for 32-bit signed integers
 * @see {@link Int64} for 64-bit signed integers
 */
export { Schema, type Int16Type } from './Int16Schema.js'
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
  toHex,
  toBytes,
  equals,
  compare,
  isNegative,
  isZero,
  Int16Error,
  INT16_MIN,
  INT16_MAX
} from './from.js'
