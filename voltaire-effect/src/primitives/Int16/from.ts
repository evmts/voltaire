import { BrandedInt16 } from '@tevm/voltaire'
import type { Int16Type } from './Int16Schema.js'
import * as Effect from 'effect/Effect'

/**
 * Error thrown when Int16 operations fail (overflow, underflow, or invalid input).
 *
 * @example
 * ```typescript
 * import * as Int16 from 'voltaire-effect/Int16'
 * import * as Effect from 'effect/Effect'
 *
 * const result = Int16.from(99999) // Will fail - out of range
 * Effect.runSync(Effect.either(result))
 * // Left(Int16Error { message: '...' })
 * ```
 *
 * @since 0.0.1
 */
export class Int16Error {
  readonly _tag = 'Int16Error'
  constructor(readonly message: string) {}
}

/**
 * Creates an Int16 from a number, bigint, or string, wrapped in an Effect.
 *
 * @param value - The value to convert (must be in range -32768 to 32767)
 * @returns An Effect that resolves to Int16Type or fails with Int16Error
 *
 * @example
 * ```typescript
 * import * as Int16 from 'voltaire-effect/Int16'
 * import * as Effect from 'effect/Effect'
 *
 * const int16 = Effect.runSync(Int16.from(1000))
 * const fromString = Effect.runSync(Int16.from('-5000'))
 * ```
 *
 * @since 0.0.1
 */
export const from = (value: number | bigint | string): Effect.Effect<Int16Type, Int16Error> =>
  Effect.try({
    try: () => BrandedInt16.from(value),
    catch: (e) => new Int16Error((e as Error).message)
  })

/**
 * Adds two Int16 values, checking for overflow.
 *
 * @param a - First Int16 operand
 * @param b - Second Int16 operand
 * @returns An Effect that resolves to the sum or fails with Int16Error on overflow
 *
 * @example
 * ```typescript
 * import * as Int16 from 'voltaire-effect/Int16'
 * import * as Effect from 'effect/Effect'
 *
 * const a = Effect.runSync(Int16.from(1000))
 * const b = Effect.runSync(Int16.from(2000))
 * const sum = Effect.runSync(Int16.plus(a, b)) // 3000
 * ```
 *
 * @since 0.0.1
 */
export const plus = (a: Int16Type, b: Int16Type): Effect.Effect<Int16Type, Int16Error> =>
  Effect.try({
    try: () => BrandedInt16.plus(a, b),
    catch: (e) => new Int16Error((e as Error).message)
  })

/**
 * Subtracts two Int16 values, checking for underflow.
 *
 * @param a - First Int16 operand (minuend)
 * @param b - Second Int16 operand (subtrahend)
 * @returns An Effect that resolves to the difference or fails with Int16Error on underflow
 *
 * @example
 * ```typescript
 * import * as Int16 from 'voltaire-effect/Int16'
 * import * as Effect from 'effect/Effect'
 *
 * const a = Effect.runSync(Int16.from(5000))
 * const b = Effect.runSync(Int16.from(3000))
 * const diff = Effect.runSync(Int16.minus(a, b)) // 2000
 * ```
 *
 * @since 0.0.1
 */
export const minus = (a: Int16Type, b: Int16Type): Effect.Effect<Int16Type, Int16Error> =>
  Effect.try({
    try: () => BrandedInt16.minus(a, b),
    catch: (e) => new Int16Error((e as Error).message)
  })

/**
 * Multiplies two Int16 values, checking for overflow.
 *
 * @param a - First Int16 operand
 * @param b - Second Int16 operand
 * @returns An Effect that resolves to the product or fails with Int16Error on overflow
 *
 * @example
 * ```typescript
 * import * as Int16 from 'voltaire-effect/Int16'
 * import * as Effect from 'effect/Effect'
 *
 * const a = Effect.runSync(Int16.from(100))
 * const b = Effect.runSync(Int16.from(50))
 * const product = Effect.runSync(Int16.times(a, b)) // 5000
 * ```
 *
 * @since 0.0.1
 */
export const times = (a: Int16Type, b: Int16Type): Effect.Effect<Int16Type, Int16Error> =>
  Effect.try({
    try: () => BrandedInt16.times(a, b),
    catch: (e) => new Int16Error((e as Error).message)
  })

/**
 * Converts an Int16 to a JavaScript number.
 *
 * @param value - The Int16 value to convert
 * @returns The numeric value
 *
 * @example
 * ```typescript
 * import * as Int16 from 'voltaire-effect/Int16'
 * import * as Effect from 'effect/Effect'
 *
 * const int16 = Effect.runSync(Int16.from(1000))
 * const num = Int16.toNumber(int16) // 1000
 * ```
 *
 * @since 0.0.1
 */
export const toNumber = (value: Int16Type): number => BrandedInt16.toNumber(value)

/**
 * Converts an Int16 to a hexadecimal string.
 *
 * @param value - The Int16 value to convert
 * @returns The hex string representation
 *
 * @example
 * ```typescript
 * import * as Int16 from 'voltaire-effect/Int16'
 * import * as Effect from 'effect/Effect'
 *
 * const int16 = Effect.runSync(Int16.from(32767))
 * const hex = Int16.toHex(int16) // '0x7fff'
 * ```
 *
 * @since 0.0.1
 */
export const toHex = (value: Int16Type): string => BrandedInt16.toHex(value)

/**
 * Checks if two Int16 values are equal.
 *
 * @param a - First Int16 value
 * @param b - Second Int16 value
 * @returns True if the values are equal
 *
 * @example
 * ```typescript
 * import * as Int16 from 'voltaire-effect/Int16'
 * import * as Effect from 'effect/Effect'
 *
 * const a = Effect.runSync(Int16.from(1000))
 * const b = Effect.runSync(Int16.from(1000))
 * Int16.equals(a, b) // true
 * ```
 *
 * @since 0.0.1
 */
export const equals = (a: Int16Type, b: Int16Type): boolean => BrandedInt16.equals(a, b)

/**
 * Minimum value for Int16 (-32768).
 * @since 0.0.1
 */
export const INT16_MIN = BrandedInt16.INT16_MIN

/**
 * Maximum value for Int16 (32767).
 * @since 0.0.1
 */
export const INT16_MAX = BrandedInt16.INT16_MAX
