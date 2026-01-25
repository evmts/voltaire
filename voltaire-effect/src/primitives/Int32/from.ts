import { BrandedInt32 } from '@tevm/voltaire'
import type { Int32Type } from './Int32Schema.js'
import * as Effect from 'effect/Effect'

/**
 * Error thrown when Int32 operations fail (overflow, underflow, or invalid input).
 *
 * @example
 * ```typescript
 * import * as Int32 from 'voltaire-effect/Int32'
 * import * as Effect from 'effect/Effect'
 *
 * const result = Int32.from(9999999999) // Will fail - out of range
 * Effect.runSync(Effect.either(result))
 * // Left(Int32Error { message: '...' })
 * ```
 *
 * @since 0.0.1
 */
export class Int32Error {
  readonly _tag = 'Int32Error'
  constructor(readonly message: string) {}
}

/**
 * Creates an Int32 from a number, bigint, or string, wrapped in an Effect.
 *
 * @param value - The value to convert (must be in range -2147483648 to 2147483647)
 * @returns An Effect that resolves to Int32Type or fails with Int32Error
 *
 * @example
 * ```typescript
 * import * as Int32 from 'voltaire-effect/Int32'
 * import * as Effect from 'effect/Effect'
 *
 * const int32 = Effect.runSync(Int32.from(1000000))
 * const fromString = Effect.runSync(Int32.from('-500000'))
 * ```
 *
 * @since 0.0.1
 */
export const from = (value: number | bigint | string): Effect.Effect<Int32Type, Int32Error> =>
  Effect.try({
    try: () => BrandedInt32.from(value),
    catch: (e) => new Int32Error((e as Error).message)
  })

/**
 * Adds two Int32 values, checking for overflow.
 *
 * @param a - First Int32 operand
 * @param b - Second Int32 operand
 * @returns An Effect that resolves to the sum or fails with Int32Error on overflow
 *
 * @example
 * ```typescript
 * import * as Int32 from 'voltaire-effect/Int32'
 * import * as Effect from 'effect/Effect'
 *
 * const a = Effect.runSync(Int32.from(1000000))
 * const b = Effect.runSync(Int32.from(2000000))
 * const sum = Effect.runSync(Int32.plus(a, b)) // 3000000
 * ```
 *
 * @since 0.0.1
 */
export const plus = (a: Int32Type, b: Int32Type): Effect.Effect<Int32Type, Int32Error> =>
  Effect.try({
    try: () => BrandedInt32.plus(a, b),
    catch: (e) => new Int32Error((e as Error).message)
  })

/**
 * Subtracts two Int32 values, checking for underflow.
 *
 * @param a - First Int32 operand (minuend)
 * @param b - Second Int32 operand (subtrahend)
 * @returns An Effect that resolves to the difference or fails with Int32Error on underflow
 *
 * @example
 * ```typescript
 * import * as Int32 from 'voltaire-effect/Int32'
 * import * as Effect from 'effect/Effect'
 *
 * const a = Effect.runSync(Int32.from(5000000))
 * const b = Effect.runSync(Int32.from(3000000))
 * const diff = Effect.runSync(Int32.minus(a, b)) // 2000000
 * ```
 *
 * @since 0.0.1
 */
export const minus = (a: Int32Type, b: Int32Type): Effect.Effect<Int32Type, Int32Error> =>
  Effect.try({
    try: () => BrandedInt32.minus(a, b),
    catch: (e) => new Int32Error((e as Error).message)
  })

/**
 * Multiplies two Int32 values, checking for overflow.
 *
 * @param a - First Int32 operand
 * @param b - Second Int32 operand
 * @returns An Effect that resolves to the product or fails with Int32Error on overflow
 *
 * @example
 * ```typescript
 * import * as Int32 from 'voltaire-effect/Int32'
 * import * as Effect from 'effect/Effect'
 *
 * const a = Effect.runSync(Int32.from(1000))
 * const b = Effect.runSync(Int32.from(500))
 * const product = Effect.runSync(Int32.times(a, b)) // 500000
 * ```
 *
 * @since 0.0.1
 */
export const times = (a: Int32Type, b: Int32Type): Effect.Effect<Int32Type, Int32Error> =>
  Effect.try({
    try: () => BrandedInt32.times(a, b),
    catch: (e) => new Int32Error((e as Error).message)
  })

/**
 * Converts an Int32 to a JavaScript number.
 *
 * @param value - The Int32 value to convert
 * @returns The numeric value
 *
 * @example
 * ```typescript
 * import * as Int32 from 'voltaire-effect/Int32'
 * import * as Effect from 'effect/Effect'
 *
 * const int32 = Effect.runSync(Int32.from(1000000))
 * const num = Int32.toNumber(int32) // 1000000
 * ```
 *
 * @since 0.0.1
 */
export const toNumber = (value: Int32Type): number => BrandedInt32.toNumber(value)

/**
 * Converts an Int32 to a bigint.
 *
 * @param value - The Int32 value to convert
 * @returns The bigint value
 *
 * @example
 * ```typescript
 * import * as Int32 from 'voltaire-effect/Int32'
 * import * as Effect from 'effect/Effect'
 *
 * const int32 = Effect.runSync(Int32.from(1000000))
 * const big = Int32.toBigInt(int32) // 1000000n
 * ```
 *
 * @since 0.0.1
 */
export const toBigInt = (value: Int32Type): bigint => BrandedInt32.toBigInt(value)

/**
 * Converts an Int32 to a hexadecimal string.
 *
 * @param value - The Int32 value to convert
 * @returns The hex string representation
 *
 * @example
 * ```typescript
 * import * as Int32 from 'voltaire-effect/Int32'
 * import * as Effect from 'effect/Effect'
 *
 * const int32 = Effect.runSync(Int32.from(2147483647))
 * const hex = Int32.toHex(int32) // '0x7fffffff'
 * ```
 *
 * @since 0.0.1
 */
export const toHex = (value: Int32Type): string => BrandedInt32.toHex(value)

/**
 * Checks if two Int32 values are equal.
 *
 * @param a - First Int32 value
 * @param b - Second Int32 value
 * @returns True if the values are equal
 *
 * @example
 * ```typescript
 * import * as Int32 from 'voltaire-effect/Int32'
 * import * as Effect from 'effect/Effect'
 *
 * const a = Effect.runSync(Int32.from(1000000))
 * const b = Effect.runSync(Int32.from(1000000))
 * Int32.equals(a, b) // true
 * ```
 *
 * @since 0.0.1
 */
export const equals = (a: Int32Type, b: Int32Type): boolean => BrandedInt32.equals(a, b)

/**
 * Minimum value for Int32 (-2147483648).
 * @since 0.0.1
 */
export const INT32_MIN = BrandedInt32.INT32_MIN

/**
 * Maximum value for Int32 (2147483647).
 * @since 0.0.1
 */
export const INT32_MAX = BrandedInt32.INT32_MAX
