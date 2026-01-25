/**
 * Int64 module for working with signed 64-bit integers in Effect.
 * Provides type-safe arithmetic operations with overflow checking.
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
 * const sum = Effect.runSync(Int64.plus(a, b))
 * const diff = Effect.runSync(Int64.minus(a, b))
 * ```
 *
 * @since 0.0.1
 * @module
 */
export { Schema, type Int64Type } from './Int64Schema.js'
export { from, plus, minus, times, toNumber, toBigInt, toHex, equals, Int64Error, INT64_MIN, INT64_MAX } from './from.js'
