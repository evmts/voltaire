/**
 * @fileoverview Effect-based operations for Int8 (signed 8-bit integer) type.
 * Provides type-safe arithmetic operations with overflow/underflow checking.
 * @module Int8/from
 * @since 0.0.1
 */

import { BrandedInt8 } from '@tevm/voltaire'
import type { Int8Type } from './Int8Schema.js'
import * as Effect from 'effect/Effect'

export { BrandedInt8 }

/**
 * Error thrown when Int8 operations fail.
 *
 * @description
 * Represents failures in Int8 operations including:
 * - Overflow (result > 127)
 * - Underflow (result < -128)
 * - Invalid input (non-numeric values, NaN, Infinity)
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
 * @see {@link Int16Error} for 16-bit integer errors
 * @see {@link Int32Error} for 32-bit integer errors
 */
export class Int8Error {
  /** Discriminant tag for pattern matching */
  readonly _tag = 'Int8Error'
  /**
   * @param message - Description of the error
   */
  constructor(readonly message: string) {}
}

/**
 * Creates an Int8 from a number, bigint, or string, wrapped in an Effect.
 *
 * @description
 * Safely constructs an Int8 value with validation. The value must be within
 * the range -128 to 127 (inclusive). Non-integer values are truncated.
 *
 * @param value - The value to convert (must be in range -128 to 127)
 * @returns An Effect that resolves to Int8Type or fails with Int8Error
 * @throws {Int8Error} When value is outside range -128 to 127 or invalid
 *
 * @example
 * ```typescript
 * import * as Int8 from 'voltaire-effect/Int8'
 * import * as Effect from 'effect/Effect'
 *
 * // From number
 * const int8 = Effect.runSync(Int8.from(42))
 *
 * // From string
 * const fromString = Effect.runSync(Int8.from('-100'))
 *
 * // Handle errors
 * const result = Effect.runSync(Effect.either(Int8.from(999)))
 * // Left(Int8Error)
 * ```
 *
 * @since 0.0.1
 * @see {@link Schema} for schema-based parsing
 * @see {@link Int16.from} for larger range
 */
export const from = (value: number | bigint | string): Effect.Effect<Int8Type, Int8Error> =>
  Effect.try({
    try: () => BrandedInt8.from(value),
    catch: (e) => new Int8Error((e as Error).message)
  })

/**
 * Creates an Int8 from a hexadecimal string, wrapped in an Effect.
 * @param hex - Hex string (with or without 0x prefix)
 * @returns An Effect that resolves to Int8Type or fails with Int8Error
 * @since 0.0.1
 */
export const fromHex = (hex: string): Effect.Effect<Int8Type, Int8Error> =>
  Effect.try({
    try: () => BrandedInt8.fromHex(hex),
    catch: (e) => new Int8Error((e as Error).message)
  })

/**
 * Creates an Int8 from bytes (two's complement), wrapped in an Effect.
 * @param bytes - Uint8Array of length 1
 * @returns An Effect that resolves to Int8Type or fails with Int8Error
 * @since 0.0.1
 */
export const fromBytes = (bytes: Uint8Array): Effect.Effect<Int8Type, Int8Error> =>
  Effect.try({
    try: () => BrandedInt8.fromBytes(bytes),
    catch: (e) => new Int8Error((e as Error).message)
  })

/**
 * Adds two Int8 values, checking for overflow.
 *
 * @description
 * Performs addition with overflow checking. If the result would exceed 127,
 * the operation fails with an Int8Error instead of wrapping.
 *
 * @param a - First Int8 operand
 * @param b - Second Int8 operand
 * @returns An Effect that resolves to the sum or fails with Int8Error on overflow
 * @throws {Int8Error} When result would exceed 127 (overflow)
 *
 * @example
 * ```typescript
 * import * as Int8 from 'voltaire-effect/Int8'
 * import * as Effect from 'effect/Effect'
 *
 * const a = Effect.runSync(Int8.from(10))
 * const b = Effect.runSync(Int8.from(20))
 * const sum = Effect.runSync(Int8.plus(a, b)) // 30
 *
 * // Overflow example
 * const max = Effect.runSync(Int8.from(127))
 * const one = Effect.runSync(Int8.from(1))
 * // Int8.plus(max, one) would fail with Int8Error
 * ```
 *
 * @since 0.0.1
 * @see {@link minus} for subtraction
 * @see {@link times} for multiplication
 */
export const plus = (a: Int8Type, b: Int8Type): Effect.Effect<Int8Type, Int8Error> =>
  Effect.try({
    try: () => BrandedInt8.plus(a, b),
    catch: (e) => new Int8Error((e as Error).message)
  })

/** Alias for plus - adds two Int8 values */
export const add = plus

/**
 * Subtracts two Int8 values, checking for underflow.
 *
 * @description
 * Performs subtraction with underflow checking. If the result would be less than -128,
 * the operation fails with an Int8Error instead of wrapping.
 *
 * @param a - First Int8 operand (minuend)
 * @param b - Second Int8 operand (subtrahend)
 * @returns An Effect that resolves to the difference or fails with Int8Error on underflow
 * @throws {Int8Error} When result would be less than -128 (underflow)
 *
 * @example
 * ```typescript
 * import * as Int8 from 'voltaire-effect/Int8'
 * import * as Effect from 'effect/Effect'
 *
 * const a = Effect.runSync(Int8.from(50))
 * const b = Effect.runSync(Int8.from(30))
 * const diff = Effect.runSync(Int8.minus(a, b)) // 20
 *
 * // Underflow example
 * const min = Effect.runSync(Int8.from(-128))
 * const one = Effect.runSync(Int8.from(1))
 * // Int8.minus(min, one) would fail with Int8Error
 * ```
 *
 * @since 0.0.1
 * @see {@link plus} for addition
 * @see {@link times} for multiplication
 */
export const minus = (a: Int8Type, b: Int8Type): Effect.Effect<Int8Type, Int8Error> =>
  Effect.try({
    try: () => BrandedInt8.minus(a, b),
    catch: (e) => new Int8Error((e as Error).message)
  })

/** Alias for minus - subtracts two Int8 values */
export const sub = minus

/**
 * Multiplies two Int8 values, checking for overflow.
 *
 * @description
 * Performs multiplication with overflow checking. If the result would exceed
 * the Int8 range (-128 to 127), the operation fails with an Int8Error.
 *
 * @param a - First Int8 operand
 * @param b - Second Int8 operand
 * @returns An Effect that resolves to the product or fails with Int8Error on overflow
 * @throws {Int8Error} When result would be outside range -128 to 127
 *
 * @example
 * ```typescript
 * import * as Int8 from 'voltaire-effect/Int8'
 * import * as Effect from 'effect/Effect'
 *
 * const a = Effect.runSync(Int8.from(5))
 * const b = Effect.runSync(Int8.from(10))
 * const product = Effect.runSync(Int8.times(a, b)) // 50
 *
 * // Overflow example
 * const big = Effect.runSync(Int8.from(100))
 * // Int8.times(big, big) would fail with Int8Error
 * ```
 *
 * @since 0.0.1
 * @see {@link plus} for addition
 * @see {@link minus} for subtraction
 */
export const times = (a: Int8Type, b: Int8Type): Effect.Effect<Int8Type, Int8Error> =>
  Effect.try({
    try: () => BrandedInt8.times(a, b),
    catch: (e) => new Int8Error((e as Error).message)
  })

/** Alias for times - multiplies two Int8 values */
export const mul = times

/**
 * Divides two Int8 values, checking for division by zero.
 * @param a - Dividend
 * @param b - Divisor
 * @returns An Effect that resolves to the quotient or fails with Int8Error
 * @since 0.0.1
 */
export const div = (a: Int8Type, b: Int8Type): Effect.Effect<Int8Type, Int8Error> =>
  Effect.try({
    try: () => BrandedInt8.dividedBy(a, b),
    catch: (e) => new Int8Error((e as Error).message)
  })

/**
 * Negates an Int8 value, checking for overflow (MIN_VALUE case).
 * @param value - The value to negate
 * @returns An Effect that resolves to the negated value or fails with Int8Error
 * @since 0.0.1
 */
export const neg = (value: Int8Type): Effect.Effect<Int8Type, Int8Error> =>
  Effect.try({
    try: () => BrandedInt8.negate(value),
    catch: (e) => new Int8Error((e as Error).message)
  })

/**
 * Computes the absolute value of an Int8, checking for overflow (MIN_VALUE case).
 * @param value - The value to get absolute value of
 * @returns An Effect that resolves to the absolute value or fails with Int8Error
 * @since 0.0.1
 */
export const abs = (value: Int8Type): Effect.Effect<Int8Type, Int8Error> =>
  Effect.try({
    try: () => BrandedInt8.abs(value),
    catch: (e) => new Int8Error((e as Error).message)
  })

/**
 * Converts an Int8 to a JavaScript number.
 *
 * @description
 * Extracts the underlying numeric value from an Int8. This is a lossless
 * conversion since all Int8 values fit within JavaScript's safe integer range.
 *
 * @param value - The Int8 value to convert
 * @returns The numeric value (always an integer in range -128 to 127)
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
 * @see {@link toHex} for hexadecimal string conversion
 */
export const toNumber = (value: Int8Type): number => BrandedInt8.toNumber(value)

/**
 * Converts an Int8 to a hexadecimal string.
 *
 * @description
 * Returns the value as a 0x-prefixed hexadecimal string. Negative values
 * are represented in two's complement format.
 *
 * @param value - The Int8 value to convert
 * @returns The hex string representation with 0x prefix
 *
 * @example
 * ```typescript
 * import * as Int8 from 'voltaire-effect/Int8'
 * import * as Effect from 'effect/Effect'
 *
 * const int8 = Effect.runSync(Int8.from(127))
 * const hex = Int8.toHex(int8) // '0x7f'
 *
 * const negative = Effect.runSync(Int8.from(-1))
 * const negHex = Int8.toHex(negative) // '0xff'
 * ```
 *
 * @since 0.0.1
 * @see {@link toNumber} for numeric conversion
 */
export const toHex = (value: Int8Type): string => BrandedInt8.toHex(value)

/**
 * Converts an Int8 to bytes (two's complement, 1 byte).
 * @param value - The Int8 value to convert
 * @returns Uint8Array of length 1
 * @since 0.0.1
 */
export const toBytes = (value: Int8Type): Uint8Array => BrandedInt8.toBytes(value)

/**
 * Checks if two Int8 values are equal.
 *
 * @description
 * Performs value equality comparison between two Int8 values.
 *
 * @param a - First Int8 value
 * @param b - Second Int8 value
 * @returns True if the values are equal, false otherwise
 *
 * @example
 * ```typescript
 * import * as Int8 from 'voltaire-effect/Int8'
 * import * as Effect from 'effect/Effect'
 *
 * const a = Effect.runSync(Int8.from(42))
 * const b = Effect.runSync(Int8.from(42))
 * const c = Effect.runSync(Int8.from(10))
 *
 * Int8.equals(a, b) // true
 * Int8.equals(a, c) // false
 * ```
 *
 * @since 0.0.1
 */
export const equals = (a: Int8Type, b: Int8Type): boolean => BrandedInt8.equals(a, b)

/**
 * Compares two Int8 values.
 * @param a - First value
 * @param b - Second value
 * @returns -1 if a < b, 0 if a === b, 1 if a > b
 * @since 0.0.1
 */
export const compare = (a: Int8Type, b: Int8Type): -1 | 0 | 1 => {
  if (a < b) return -1
  if (a > b) return 1
  return 0
}

/**
 * Checks if an Int8 value is negative.
 * @param value - The value to check
 * @returns True if the value is less than 0
 * @since 0.0.1
 */
export const isNegative = (value: Int8Type): boolean => BrandedInt8.isNegative(value)

/**
 * Checks if an Int8 value is zero.
 * @param value - The value to check
 * @returns True if the value is 0
 * @since 0.0.1
 */
export const isZero = (value: Int8Type): boolean => BrandedInt8.isZero(value)

/**
 * Minimum value for Int8.
 *
 * @description
 * The smallest value that can be represented as an Int8: -128 (−2^7).
 *
 * @example
 * ```typescript
 * import * as Int8 from 'voltaire-effect/Int8'
 *
 * console.log(Int8.INT8_MIN) // -128
 * ```
 *
 * @since 0.0.1
 * @see {@link INT8_MAX} for the maximum value
 */
export const INT8_MIN = BrandedInt8.INT8_MIN

/**
 * Maximum value for Int8.
 *
 * @description
 * The largest value that can be represented as an Int8: 127 (2^7 - 1).
 *
 * @example
 * ```typescript
 * import * as Int8 from 'voltaire-effect/Int8'
 *
 * console.log(Int8.INT8_MAX) // 127
 * ```
 *
 * @since 0.0.1
 * @see {@link INT8_MIN} for the minimum value
 */
export const INT8_MAX = BrandedInt8.INT8_MAX
