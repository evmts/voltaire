/**
 * @fileoverview Int8 module for working with signed 8-bit integers in Effect.
 *
 * @description
 * Provides type-safe arithmetic operations with overflow checking for signed
 * 8-bit integers. Values are constrained to the range -128 to 127 (inclusive).
 *
 * Key features:
 * - Type-safe branded Int8 values
 * - Effect-based error handling for overflow/underflow
 * - Schema validation for parsing from various input types
 * - Arithmetic operations: plus, minus, times
 * - Conversion utilities: toNumber, toHex
 *
 * @example
 * ```typescript
 * import * as Int8 from 'voltaire-effect/Int8'
 * import * as Effect from 'effect/Effect'
 *
 * // Create Int8 values
 * const a = Effect.runSync(Int8.from(42))
 * const b = Effect.runSync(Int8.from(10))
 *
 * // Arithmetic operations
 * const sum = Effect.runSync(Int8.plus(a, b))   // 52
 * const diff = Effect.runSync(Int8.minus(a, b)) // 32
 *
 * // Constants
 * console.log(Int8.INT8_MIN) // -128
 * console.log(Int8.INT8_MAX) // 127
 * ```
 *
 * @since 0.0.1
 * @module Int8
 * @see {@link Int16} for 16-bit signed integers
 * @see {@link Int32} for 32-bit signed integers
 * @see {@link Int64} for 64-bit signed integers
 */
export { Schema, type Int8Type } from './Int8Schema.js'
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
  Int8Error,
  INT8_MIN,
  INT8_MAX
} from './from.js'
