/**
 * Int16 module for working with signed 16-bit integers in Effect.
 * Provides type-safe arithmetic operations with overflow checking.
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
 * const sum = Effect.runSync(Int16.plus(a, b))
 * const diff = Effect.runSync(Int16.minus(a, b))
 * ```
 *
 * @since 0.0.1
 * @module
 */
export { Schema, type Int16Type } from './Int16Schema.js'
export { from, plus, minus, times, toNumber, toHex, equals, Int16Error, INT16_MIN, INT16_MAX } from './from.js'
