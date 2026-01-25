/**
 * Int8 module for working with signed 8-bit integers in Effect.
 * Provides type-safe arithmetic operations with overflow checking.
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
 * const sum = Effect.runSync(Int8.plus(a, b))
 * const diff = Effect.runSync(Int8.minus(a, b))
 * ```
 *
 * @since 0.0.1
 * @module
 */
export { Schema, type Int8Type } from './Int8Schema.js'
export { from, plus, minus, times, toNumber, toHex, equals, Int8Error, INT8_MIN, INT8_MAX } from './from.js'
