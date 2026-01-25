import { BrandedInt128 } from '@tevm/voltaire'
import type { Int128Type } from './Int128Schema.js'
import * as Effect from 'effect/Effect'

/**
 * Error thrown when Int128 operations fail (overflow, underflow, or invalid input).
 *
 * @example
 * ```typescript
 * import * as Int128 from 'voltaire-effect/Int128'
 * import * as Effect from 'effect/Effect'
 *
 * const result = Int128.from('invalid')
 * Effect.runSync(Effect.either(result))
 * // Left(Int128Error { message: '...' })
 * ```
 *
 * @since 0.0.1
 */
export class Int128Error {
  readonly _tag = 'Int128Error'
  constructor(readonly message: string) {}
}

/**
 * Creates an Int128 from a number, bigint, or string, wrapped in an Effect.
 *
 * @param value - The value to convert (must be in Int128 range)
 * @returns An Effect that resolves to Int128Type or fails with Int128Error
 *
 * @example
 * ```typescript
 * import * as Int128 from 'voltaire-effect/Int128'
 * import * as Effect from 'effect/Effect'
 *
 * const int128 = Effect.runSync(Int128.from(170141183460469231731687303715884105727n))
 * const fromString = Effect.runSync(Int128.from('-1000000000000000000000'))
 * ```
 *
 * @since 0.0.1
 */
export const from = (value: number | bigint | string): Effect.Effect<Int128Type, Int128Error> =>
  Effect.try({
    try: () => BrandedInt128.from(value),
    catch: (e) => new Int128Error((e as Error).message)
  })

/**
 * Adds two Int128 values, checking for overflow.
 *
 * @param a - First Int128 operand
 * @param b - Second Int128 operand
 * @returns An Effect that resolves to the sum or fails with Int128Error on overflow
 *
 * @example
 * ```typescript
 * import * as Int128 from 'voltaire-effect/Int128'
 * import * as Effect from 'effect/Effect'
 *
 * const a = Effect.runSync(Int128.from(1000000000000000000000n))
 * const b = Effect.runSync(Int128.from(2000000000000000000000n))
 * const sum = Effect.runSync(Int128.plus(a, b))
 * ```
 *
 * @since 0.0.1
 */
export const plus = (a: Int128Type, b: Int128Type): Effect.Effect<Int128Type, Int128Error> =>
  Effect.try({
    try: () => BrandedInt128.plus(a, b),
    catch: (e) => new Int128Error((e as Error).message)
  })

/**
 * Subtracts two Int128 values, checking for underflow.
 *
 * @param a - First Int128 operand (minuend)
 * @param b - Second Int128 operand (subtrahend)
 * @returns An Effect that resolves to the difference or fails with Int128Error on underflow
 *
 * @example
 * ```typescript
 * import * as Int128 from 'voltaire-effect/Int128'
 * import * as Effect from 'effect/Effect'
 *
 * const a = Effect.runSync(Int128.from(5000000000000000000000n))
 * const b = Effect.runSync(Int128.from(3000000000000000000000n))
 * const diff = Effect.runSync(Int128.minus(a, b))
 * ```
 *
 * @since 0.0.1
 */
export const minus = (a: Int128Type, b: Int128Type): Effect.Effect<Int128Type, Int128Error> =>
  Effect.try({
    try: () => BrandedInt128.minus(a, b),
    catch: (e) => new Int128Error((e as Error).message)
  })

/**
 * Multiplies two Int128 values, checking for overflow.
 *
 * @param a - First Int128 operand
 * @param b - Second Int128 operand
 * @returns An Effect that resolves to the product or fails with Int128Error on overflow
 *
 * @example
 * ```typescript
 * import * as Int128 from 'voltaire-effect/Int128'
 * import * as Effect from 'effect/Effect'
 *
 * const a = Effect.runSync(Int128.from(1000000000000n))
 * const b = Effect.runSync(Int128.from(500000000000n))
 * const product = Effect.runSync(Int128.times(a, b))
 * ```
 *
 * @since 0.0.1
 */
export const times = (a: Int128Type, b: Int128Type): Effect.Effect<Int128Type, Int128Error> =>
  Effect.try({
    try: () => BrandedInt128.times(a, b),
    catch: (e) => new Int128Error((e as Error).message)
  })

/**
 * Converts an Int128 to a JavaScript number.
 * Note: May lose precision for large values.
 *
 * @param value - The Int128 value to convert
 * @returns The numeric value
 *
 * @example
 * ```typescript
 * import * as Int128 from 'voltaire-effect/Int128'
 * import * as Effect from 'effect/Effect'
 *
 * const int128 = Effect.runSync(Int128.from(1000000n))
 * const num = Int128.toNumber(int128) // 1000000
 * ```
 *
 * @since 0.0.1
 */
export const toNumber = (value: Int128Type): number => BrandedInt128.toNumber(value)

/**
 * Converts an Int128 to a bigint.
 *
 * @param value - The Int128 value to convert
 * @returns The bigint value
 *
 * @example
 * ```typescript
 * import * as Int128 from 'voltaire-effect/Int128'
 * import * as Effect from 'effect/Effect'
 *
 * const int128 = Effect.runSync(Int128.from(1000000000000000000000n))
 * const big = Int128.toBigInt(int128)
 * ```
 *
 * @since 0.0.1
 */
export const toBigInt = (value: Int128Type): bigint => BrandedInt128.toBigInt(value)

/**
 * Converts an Int128 to a hexadecimal string.
 *
 * @param value - The Int128 value to convert
 * @returns The hex string representation
 *
 * @example
 * ```typescript
 * import * as Int128 from 'voltaire-effect/Int128'
 * import * as Effect from 'effect/Effect'
 *
 * const int128 = Effect.runSync(Int128.from(255n))
 * const hex = Int128.toHex(int128) // '0xff'
 * ```
 *
 * @since 0.0.1
 */
export const toHex = (value: Int128Type): string => BrandedInt128.toHex(value)

/**
 * Checks if two Int128 values are equal.
 *
 * @param a - First Int128 value
 * @param b - Second Int128 value
 * @returns True if the values are equal
 *
 * @example
 * ```typescript
 * import * as Int128 from 'voltaire-effect/Int128'
 * import * as Effect from 'effect/Effect'
 *
 * const a = Effect.runSync(Int128.from(1000000000000000000000n))
 * const b = Effect.runSync(Int128.from(1000000000000000000000n))
 * Int128.equals(a, b) // true
 * ```
 *
 * @since 0.0.1
 */
export const equals = (a: Int128Type, b: Int128Type): boolean => BrandedInt128.equals(a, b)

/**
 * Maximum value for Int128 (2^127 - 1).
 * @since 0.0.1
 */
export const MAX = BrandedInt128.MAX

/**
 * Minimum value for Int128 (-2^127).
 * @since 0.0.1
 */
export const MIN = BrandedInt128.MIN

/**
 * Int128 zero constant.
 * @since 0.0.1
 */
export const ZERO = BrandedInt128.ZERO

/**
 * Int128 one constant.
 * @since 0.0.1
 */
export const ONE = BrandedInt128.ONE

/**
 * Int128 negative one constant.
 * @since 0.0.1
 */
export const NEG_ONE = BrandedInt128.NEG_ONE
