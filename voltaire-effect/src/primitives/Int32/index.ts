/**
 * Int32 module for working with signed 32-bit integers in Effect.
 * Provides type-safe arithmetic operations with overflow checking.
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
 * const sum = Effect.runSync(Int32.plus(a, b))
 * const diff = Effect.runSync(Int32.minus(a, b))
 * ```
 *
 * @since 0.0.1
 * @module
 */
export { Schema, type Int32Type } from './Int32Schema.js'
export { from, plus, minus, times, toNumber, toBigInt, toHex, equals, Int32Error, INT32_MIN, INT32_MAX } from './from.js'
