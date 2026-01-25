/**
 * @fileoverview Int64 module for working with signed 64-bit integers in Effect.
 *
 * @description
 * Provides type-safe arithmetic operations with overflow checking for signed
 * 64-bit integers. Values are constrained to the range -9223372036854775808 to
 * 9223372036854775807 (inclusive).
 *
 * Key features:
 * - Type-safe branded Int64 values (backed by BigInt)
 * - Effect-based error handling for overflow/underflow
 * - Schema validation for parsing from various input types
 * - Arithmetic operations: plus, minus, times
 * - Conversion utilities: toNumber, toBigInt, toHex
 *
 * @example
 * ```typescript
 * import * as Int64 from 'voltaire-effect/Int64'
 * import * as Effect from 'effect/Effect'
 *
 * // Create Int64 values
 * const a = Effect.runSync(Int64.from(1000000000000n))
 * const b = Effect.runSync(Int64.from(500000000000n))
 *
 * // Arithmetic operations
 * const sum = Effect.runSync(Int64.plus(a, b))   // 1500000000000n
 * const diff = Effect.runSync(Int64.minus(a, b)) // 500000000000n
 *
 * // Constants
 * console.log(Int64.INT64_MIN) // -9223372036854775808n
 * console.log(Int64.INT64_MAX) // 9223372036854775807n
 * ```
 *
 * @since 0.0.1
 * @module Int64
 * @see {@link Int32} for 32-bit signed integers
 * @see {@link Int128} for 128-bit signed integers
 * @see {@link Int256} for 256-bit signed integers
 */
export { Schema, type Int64Type } from './Int64Schema.js'
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
  Int64Error,
  INT64_MIN,
  INT64_MAX
} from './from.js'
