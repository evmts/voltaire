import { BrandedInt8 } from '@tevm/voltaire'
import type { Int8Type } from './Int8Schema.js'
import * as Effect from 'effect/Effect'

/**
 * Error thrown when Int8 operations fail (overflow, underflow, or invalid input).
 *
 * @example
 * ```typescript
 * import * as Int8 from 'voltaire-effect/Int8'
 * import * as Effect from 'effect/Effect'
 *
 * const result = Int8.from(999) // Will fail - out of range
 * Effect.runSync(Effect.either(result))
 * // Left(Int8Error { message: '...' })
 * ```
 *
 * @since 0.0.1
 */
export class Int8Error {
  readonly _tag = 'Int8Error'
  constructor(readonly message: string) {}
}

/**
 * Creates an Int8 from a number, bigint, or string, wrapped in an Effect.
 *
 * @param value - The value to convert (must be in range -128 to 127)
 * @returns An Effect that resolves to Int8Type or fails with Int8Error
 *
 * @example
 * ```typescript
 * import * as Int8 from 'voltaire-effect/Int8'
 * import * as Effect from 'effect/Effect'
 *
 * const int8 = Effect.runSync(Int8.from(42))
 * const fromString = Effect.runSync(Int8.from('-100'))
 * ```
 *
 * @since 0.0.1
 */
export const from = (value: number | bigint | string): Effect.Effect<Int8Type, Int8Error> =>
  Effect.try({
    try: () => BrandedInt8.from(value),
    catch: (e) => new Int8Error((e as Error).message)
  })

/**
 * Adds two Int8 values, checking for overflow.
 *
 * @param a - First Int8 operand
 * @param b - Second Int8 operand
 * @returns An Effect that resolves to the sum or fails with Int8Error on overflow
 *
 * @example
 * ```typescript
 * import * as Int8 from 'voltaire-effect/Int8'
 * import * as Effect from 'effect/Effect'
 *
 * const a = Effect.runSync(Int8.from(10))
 * const b = Effect.runSync(Int8.from(20))
 * const sum = Effect.runSync(Int8.plus(a, b)) // 30
 * ```
 *
 * @since 0.0.1
 */
export const plus = (a: Int8Type, b: Int8Type): Effect.Effect<Int8Type, Int8Error> =>
  Effect.try({
    try: () => BrandedInt8.plus(a, b),
    catch: (e) => new Int8Error((e as Error).message)
  })

/**
 * Subtracts two Int8 values, checking for underflow.
 *
 * @param a - First Int8 operand (minuend)
 * @param b - Second Int8 operand (subtrahend)
 * @returns An Effect that resolves to the difference or fails with Int8Error on underflow
 *
 * @example
 * ```typescript
 * import * as Int8 from 'voltaire-effect/Int8'
 * import * as Effect from 'effect/Effect'
 *
 * const a = Effect.runSync(Int8.from(50))
 * const b = Effect.runSync(Int8.from(30))
 * const diff = Effect.runSync(Int8.minus(a, b)) // 20
 * ```
 *
 * @since 0.0.1
 */
export const minus = (a: Int8Type, b: Int8Type): Effect.Effect<Int8Type, Int8Error> =>
  Effect.try({
    try: () => BrandedInt8.minus(a, b),
    catch: (e) => new Int8Error((e as Error).message)
  })

/**
 * Multiplies two Int8 values, checking for overflow.
 *
 * @param a - First Int8 operand
 * @param b - Second Int8 operand
 * @returns An Effect that resolves to the product or fails with Int8Error on overflow
 *
 * @example
 * ```typescript
 * import * as Int8 from 'voltaire-effect/Int8'
 * import * as Effect from 'effect/Effect'
 *
 * const a = Effect.runSync(Int8.from(5))
 * const b = Effect.runSync(Int8.from(10))
 * const product = Effect.runSync(Int8.times(a, b)) // 50
 * ```
 *
 * @since 0.0.1
 */
export const times = (a: Int8Type, b: Int8Type): Effect.Effect<Int8Type, Int8Error> =>
  Effect.try({
    try: () => BrandedInt8.times(a, b),
    catch: (e) => new Int8Error((e as Error).message)
  })

/**
 * Converts an Int8 to a JavaScript number.
 *
 * @param value - The Int8 value to convert
 * @returns The numeric value
 *
 * @example
 * ```typescript
 * import * as Int8 from 'voltaire-effect/Int8'
 * import * as Effect from 'effect/Effect'
 *
 * const int8 = Effect.runSync(Int8.from(42))
 * const num = Int8.toNumber(int8) // 42
 * ```
 *
 * @since 0.0.1
 */
export const toNumber = (value: Int8Type): number => BrandedInt8.toNumber(value)

/**
 * Converts an Int8 to a hexadecimal string.
 *
 * @param value - The Int8 value to convert
 * @returns The hex string representation
 *
 * @example
 * ```typescript
 * import * as Int8 from 'voltaire-effect/Int8'
 * import * as Effect from 'effect/Effect'
 *
 * const int8 = Effect.runSync(Int8.from(127))
 * const hex = Int8.toHex(int8) // '0x7f'
 * ```
 *
 * @since 0.0.1
 */
export const toHex = (value: Int8Type): string => BrandedInt8.toHex(value)

/**
 * Checks if two Int8 values are equal.
 *
 * @param a - First Int8 value
 * @param b - Second Int8 value
 * @returns True if the values are equal
 *
 * @example
 * ```typescript
 * import * as Int8 from 'voltaire-effect/Int8'
 * import * as Effect from 'effect/Effect'
 *
 * const a = Effect.runSync(Int8.from(42))
 * const b = Effect.runSync(Int8.from(42))
 * Int8.equals(a, b) // true
 * ```
 *
 * @since 0.0.1
 */
export const equals = (a: Int8Type, b: Int8Type): boolean => BrandedInt8.equals(a, b)

/**
 * Minimum value for Int8 (-128).
 * @since 0.0.1
 */
export const INT8_MIN = BrandedInt8.INT8_MIN

/**
 * Maximum value for Int8 (127).
 * @since 0.0.1
 */
export const INT8_MAX = BrandedInt8.INT8_MAX
