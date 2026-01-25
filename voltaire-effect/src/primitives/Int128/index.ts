/**
 * @fileoverview Int128 module for working with signed 128-bit integers in Effect.
 *
 * @description
 * Provides type-safe arithmetic operations with overflow checking for signed
 * 128-bit integers. Values are constrained to the range -2^127 to 2^127-1 (inclusive).
 *
 * Key features:
 * - Type-safe branded Int128 values (backed by BigInt)
 * - Effect-based error handling for overflow/underflow
 * - Schema validation for parsing from various input types
 * - Arithmetic operations: plus, minus, times
 * - Conversion utilities: toNumber, toBigInt, toHex
 * - Constants: MAX, MIN, ZERO, ONE, NEG_ONE
 *
 * @example
 * ```typescript
 * import * as Int128 from 'voltaire-effect/Int128'
 * import * as Effect from 'effect/Effect'
 *
 * // Create Int128 values
 * const a = Effect.runSync(Int128.from(1000000000000000000000n))
 * const b = Effect.runSync(Int128.from(500000000000000000000n))
 *
 * // Arithmetic operations
 * const sum = Effect.runSync(Int128.plus(a, b))   // 1500000000000000000000n
 * const diff = Effect.runSync(Int128.minus(a, b)) // 500000000000000000000n
 *
 * // Constants
 * console.log(Int128.MIN) // -170141183460469231731687303715884105728n
 * console.log(Int128.MAX) // 170141183460469231731687303715884105727n
 * ```
 *
 * @since 0.0.1
 * @module Int128
 * @see {@link Int64} for 64-bit signed integers
 * @see {@link Int256} for 256-bit signed integers (Solidity's int256)
 */
export { Schema, type Int128Type } from './Int128Schema.js'
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
  Int128Error,
  MAX,
  MIN,
  ZERO,
  ONE,
  NEG_ONE
} from './from.js'
