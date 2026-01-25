/**
 * Int128 module for working with signed 128-bit integers in Effect.
 * Provides type-safe arithmetic operations with overflow checking.
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
 * const sum = Effect.runSync(Int128.plus(a, b))
 * const diff = Effect.runSync(Int128.minus(a, b))
 * ```
 *
 * @since 0.0.1
 * @module
 */
export { Schema, type Int128Type } from './Int128Schema.js'
export { from, plus, minus, times, toNumber, toBigInt, toHex, equals, Int128Error, MAX, MIN, ZERO, ONE, NEG_ONE } from './from.js'
