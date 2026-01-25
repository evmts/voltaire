import { BrandedInt64 } from '@tevm/voltaire'
import type { Int64Type } from './Int64Schema.js'
import * as Effect from 'effect/Effect'

/**
 * Error thrown when Int64 operations fail (overflow, underflow, or invalid input).
 *
 * @example
 * ```typescript
 * import * as Int64 from 'voltaire-effect/Int64'
 * import * as Effect from 'effect/Effect'
 *
 * const result = Int64.from('invalid')
 * Effect.runSync(Effect.either(result))
 * // Left(Int64Error { message: '...' })
 * ```
 *
 * @since 0.0.1
 */
export class Int64Error {
  readonly _tag = 'Int64Error'
  constructor(readonly message: string) {}
}

/**
 * Creates an Int64 from a number, bigint, or string, wrapped in an Effect.
 *
 * @param value - The value to convert (must be in Int64 range)
 * @returns An Effect that resolves to Int64Type or fails with Int64Error
 *
 * @example
 * ```typescript
 * import * as Int64 from 'voltaire-effect/Int64'
 * import * as Effect from 'effect/Effect'
 *
 * const int64 = Effect.runSync(Int64.from(1000000000000n))
 * const fromString = Effect.runSync(Int64.from('-500000000000'))
 * ```
 *
 * @since 0.0.1
 */
export const from = (value: number | bigint | string): Effect.Effect<Int64Type, Int64Error> =>
  Effect.try({
    try: () => BrandedInt64.from(value),
    catch: (e) => new Int64Error((e as Error).message)
  })

/**
 * Adds two Int64 values, checking for overflow.
 *
 * @param a - First Int64 operand
 * @param b - Second Int64 operand
 * @returns An Effect that resolves to the sum or fails with Int64Error on overflow
 *
 * @example
 * ```typescript
 * import * as Int64 from 'voltaire-effect/Int64'
 * import * as Effect from 'effect/Effect'
 *
 * const a = Effect.runSync(Int64.from(1000000000000n))
 * const b = Effect.runSync(Int64.from(2000000000000n))
 * const sum = Effect.runSync(Int64.plus(a, b))
 * ```
 *
 * @since 0.0.1
 */
export const plus = (a: Int64Type, b: Int64Type): Effect.Effect<Int64Type, Int64Error> =>
  Effect.try({
    try: () => BrandedInt64.plus(a, b),
    catch: (e) => new Int64Error((e as Error).message)
  })

/**
 * Subtracts two Int64 values, checking for underflow.
 *
 * @param a - First Int64 operand (minuend)
 * @param b - Second Int64 operand (subtrahend)
 * @returns An Effect that resolves to the difference or fails with Int64Error on underflow
 *
 * @example
 * ```typescript
 * import * as Int64 from 'voltaire-effect/Int64'
 * import * as Effect from 'effect/Effect'
 *
 * const a = Effect.runSync(Int64.from(5000000000000n))
 * const b = Effect.runSync(Int64.from(3000000000000n))
 * const diff = Effect.runSync(Int64.minus(a, b))
 * ```
 *
 * @since 0.0.1
 */
export const minus = (a: Int64Type, b: Int64Type): Effect.Effect<Int64Type, Int64Error> =>
  Effect.try({
    try: () => BrandedInt64.minus(a, b),
    catch: (e) => new Int64Error((e as Error).message)
  })

/**
 * Multiplies two Int64 values, checking for overflow.
 *
 * @param a - First Int64 operand
 * @param b - Second Int64 operand
 * @returns An Effect that resolves to the product or fails with Int64Error on overflow
 *
 * @example
 * ```typescript
 * import * as Int64 from 'voltaire-effect/Int64'
 * import * as Effect from 'effect/Effect'
 *
 * const a = Effect.runSync(Int64.from(1000000n))
 * const b = Effect.runSync(Int64.from(500000n))
 * const product = Effect.runSync(Int64.times(a, b))
 * ```
 *
 * @since 0.0.1
 */
export const times = (a: Int64Type, b: Int64Type): Effect.Effect<Int64Type, Int64Error> =>
  Effect.try({
    try: () => BrandedInt64.times(a, b),
    catch: (e) => new Int64Error((e as Error).message)
  })

/**
 * Converts an Int64 to a JavaScript number.
 * Note: May lose precision for values outside safe integer range.
 *
 * @param value - The Int64 value to convert
 * @returns The numeric value
 *
 * @example
 * ```typescript
 * import * as Int64 from 'voltaire-effect/Int64'
 * import * as Effect from 'effect/Effect'
 *
 * const int64 = Effect.runSync(Int64.from(1000000n))
 * const num = Int64.toNumber(int64) // 1000000
 * ```
 *
 * @since 0.0.1
 */
export const toNumber = (value: Int64Type): number => BrandedInt64.toNumber(value)

/**
 * Converts an Int64 to a bigint.
 *
 * @param value - The Int64 value to convert
 * @returns The bigint value
 *
 * @example
 * ```typescript
 * import * as Int64 from 'voltaire-effect/Int64'
 * import * as Effect from 'effect/Effect'
 *
 * const int64 = Effect.runSync(Int64.from(1000000000000n))
 * const big = Int64.toBigInt(int64) // 1000000000000n
 * ```
 *
 * @since 0.0.1
 */
export const toBigInt = (value: Int64Type): bigint => BrandedInt64.toBigInt(value)

/**
 * Converts an Int64 to a hexadecimal string.
 *
 * @param value - The Int64 value to convert
 * @returns The hex string representation
 *
 * @example
 * ```typescript
 * import * as Int64 from 'voltaire-effect/Int64'
 * import * as Effect from 'effect/Effect'
 *
 * const int64 = Effect.runSync(Int64.from(255n))
 * const hex = Int64.toHex(int64) // '0xff'
 * ```
 *
 * @since 0.0.1
 */
export const toHex = (value: Int64Type): string => BrandedInt64.toHex(value)

/**
 * Checks if two Int64 values are equal.
 *
 * @param a - First Int64 value
 * @param b - Second Int64 value
 * @returns True if the values are equal
 *
 * @example
 * ```typescript
 * import * as Int64 from 'voltaire-effect/Int64'
 * import * as Effect from 'effect/Effect'
 *
 * const a = Effect.runSync(Int64.from(1000000000000n))
 * const b = Effect.runSync(Int64.from(1000000000000n))
 * Int64.equals(a, b) // true
 * ```
 *
 * @since 0.0.1
 */
export const equals = (a: Int64Type, b: Int64Type): boolean => BrandedInt64.equals(a, b)

/**
 * Minimum value for Int64 (-9223372036854775808n).
 * @since 0.0.1
 */
export const INT64_MIN = BrandedInt64.INT64_MIN

/**
 * Maximum value for Int64 (9223372036854775807n).
 * @since 0.0.1
 */
export const INT64_MAX = BrandedInt64.INT64_MAX
