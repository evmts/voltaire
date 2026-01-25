/**
 * @fileoverview Effect-based constructors and operations for Uint128 (128-bit unsigned integers).
 * 
 * Provides functional Effect wrappers around the core Uint128 primitives,
 * enabling safe error handling and composition in Effect pipelines.
 * All arithmetic operations include overflow/underflow checking.
 * 
 * @module Uint128/from
 * @since 0.0.1
 */

import { BrandedUint128 } from '@tevm/voltaire'
import type { Uint128Type } from './Uint128Schema.js'
import * as Effect from 'effect/Effect'

/**
 * Error thrown when Uint128 operations fail.
 * 
 * @description
 * Represents errors from Uint128 construction or arithmetic operations.
 * Common causes include:
 * - Value out of range (must be 0 to 2^128-1)
 * - Arithmetic overflow (result > 2^128-1)
 * - Arithmetic underflow (result < 0)
 * - Invalid input format
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Uint128 from '@voltaire-effect/primitives/Uint128'
 * 
 * const result = Effect.runSync(
 *   Effect.either(Uint128.from(-1n)) // Error: value out of range
 * )
 * if (result._tag === 'Left') {
 *   console.log(result.left._tag) // 'Uint128Error'
 * }
 * ```
 * 
 * @since 0.0.1
 */
export class Uint128Error {
  /** Discriminant tag for error identification in Effect error handling */
  readonly _tag = 'Uint128Error'
  
  /**
   * Creates a new Uint128Error.
   * @param message - Description of what went wrong
   */
  constructor(readonly message: string) {}
}

/**
 * Creates a Uint128 from a number, bigint, or string.
 * 
 * @description
 * Parses the input value and creates a validated Uint128. The value must be
 * a non-negative integer within the range 0 to 2^128-1
 * (340282366920938463463374607431768211455).
 * 
 * Min value: 0
 * Max value: 340282366920938463463374607431768211455 (2^128 - 1)
 * 
 * @param value - Value to convert (0 to 2^128-1)
 * @returns Effect containing the Uint128 or Uint128Error if validation fails
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Uint128 from '@voltaire-effect/primitives/Uint128'
 * 
 * // From bigint
 * const value = await Effect.runPromise(Uint128.from(2n ** 100n))
 * 
 * // From number (for safe integers)
 * const fromNumber = await Effect.runPromise(Uint128.from(1000000000000))
 * 
 * // From string
 * const fromString = await Effect.runPromise(Uint128.from('170141183460469231731687303715884105728'))
 * 
 * // Error handling
 * const result = Effect.runSync(Effect.either(Uint128.from(-1)))
 * ```
 * 
 * @throws {Uint128Error} When value is negative
 * @throws {Uint128Error} When value exceeds 2^128-1
 * @throws {Uint128Error} When string cannot be parsed
 * 
 * @see {@link MAX} for maximum value constant (2^128-1)
 * @see {@link MIN} for minimum value constant (0)
 * 
 * @since 0.0.1
 */
export const from = (value: number | bigint | string): Effect.Effect<Uint128Type, Uint128Error> =>
  Effect.try({
    try: () => BrandedUint128.from(value),
    catch: (e) => new Uint128Error((e as Error).message)
  })

/**
 * Adds two Uint128 values with overflow checking.
 * 
 * @description
 * Performs checked addition of two Uint128 values. Returns an error if the
 * result would exceed 2^128-1 (overflow).
 * 
 * @param a - First operand (augend)
 * @param b - Second operand (addend)
 * @returns Effect containing the sum or Uint128Error on overflow
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Uint128 from '@voltaire-effect/primitives/Uint128'
 * 
 * const a = await Effect.runPromise(Uint128.from(2n ** 100n))
 * const b = await Effect.runPromise(Uint128.from(2n ** 99n))
 * const sum = await Effect.runPromise(Uint128.plus(a, b))
 * 
 * // Overflow error
 * const max = Uint128.MAX
 * const overflow = Effect.runSync(Effect.either(Uint128.plus(max, Uint128.ONE)))
 * // Left(Uint128Error)
 * ```
 * 
 * @throws {Uint128Error} When result exceeds 2^128-1 (overflow)
 * 
 * @see {@link minus} for subtraction
 * @see {@link times} for multiplication
 * 
 * @since 0.0.1
 */
export const plus = (a: Uint128Type, b: Uint128Type): Effect.Effect<Uint128Type, Uint128Error> =>
  Effect.try({
    try: () => BrandedUint128.plus(a, b),
    catch: (e) => new Uint128Error((e as Error).message)
  })

/**
 * Subtracts two Uint128 values with underflow checking.
 * 
 * @description
 * Performs checked subtraction of two Uint128 values. Returns an error if the
 * result would be negative (underflow).
 * 
 * @param a - Minuend (value to subtract from)
 * @param b - Subtrahend (value to subtract)
 * @returns Effect containing the difference or Uint128Error on underflow
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Uint128 from '@voltaire-effect/primitives/Uint128'
 * 
 * const a = await Effect.runPromise(Uint128.from(2n ** 100n))
 * const b = await Effect.runPromise(Uint128.from(2n ** 99n))
 * const diff = await Effect.runPromise(Uint128.minus(a, b))
 * 
 * // Underflow error
 * const underflow = Effect.runSync(Effect.either(Uint128.minus(b, a)))
 * // Left(Uint128Error)
 * ```
 * 
 * @throws {Uint128Error} When result would be negative (underflow)
 * 
 * @see {@link plus} for addition
 * @see {@link times} for multiplication
 * 
 * @since 0.0.1
 */
export const minus = (a: Uint128Type, b: Uint128Type): Effect.Effect<Uint128Type, Uint128Error> =>
  Effect.try({
    try: () => BrandedUint128.minus(a, b),
    catch: (e) => new Uint128Error((e as Error).message)
  })

/**
 * Multiplies two Uint128 values with overflow checking.
 * 
 * @description
 * Performs checked multiplication of two Uint128 values. Returns an error if
 * the result would exceed 2^128-1 (overflow).
 * 
 * @param a - First operand (multiplicand)
 * @param b - Second operand (multiplier)
 * @returns Effect containing the product or Uint128Error on overflow
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Uint128 from '@voltaire-effect/primitives/Uint128'
 * 
 * const a = await Effect.runPromise(Uint128.from(2n ** 50n))
 * const b = await Effect.runPromise(Uint128.from(2n ** 60n))
 * const product = await Effect.runPromise(Uint128.times(a, b)) // 2^110
 * 
 * // Overflow error (2^64 * 2^64 = 2^128 > max)
 * const large = await Effect.runPromise(Uint128.from(2n ** 64n))
 * const overflow = Effect.runSync(Effect.either(Uint128.times(large, large)))
 * // Left(Uint128Error)
 * ```
 * 
 * @throws {Uint128Error} When result exceeds 2^128-1 (overflow)
 * 
 * @see {@link plus} for addition
 * @see {@link minus} for subtraction
 * 
 * @since 0.0.1
 */
export const times = (a: Uint128Type, b: Uint128Type): Effect.Effect<Uint128Type, Uint128Error> =>
  Effect.try({
    try: () => BrandedUint128.times(a, b),
    catch: (e) => new Uint128Error((e as Error).message)
  })

/**
 * Converts a Uint128 to a bigint.
 * 
 * @description
 * Extracts the bigint value from a Uint128. Always use this for Uint128 values
 * as they exceed JavaScript's safe integer range.
 * 
 * @param value - Uint128 value to convert
 * @returns The bigint value (0n to 2^128-1)
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Uint128 from '@voltaire-effect/primitives/Uint128'
 * 
 * const value = await Effect.runPromise(Uint128.from(2n ** 100n))
 * const bigint = Uint128.toBigInt(value)
 * ```
 * 
 * @see {@link toNumber} for small values only (loses precision)
 * 
 * @since 0.0.1
 */
export const toBigInt = (value: Uint128Type): bigint => BrandedUint128.toBigInt(value)

/**
 * Converts a Uint128 to a JavaScript number.
 * 
 * @description
 * Extracts the numeric value from a Uint128. Warning: This will lose precision
 * for virtually all Uint128 values as they exceed Number.MAX_SAFE_INTEGER.
 * Use {@link toBigInt} instead.
 * 
 * @param value - Uint128 value to convert
 * @returns The numeric value (precision loss for values > 2^53-1)
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Uint128 from '@voltaire-effect/primitives/Uint128'
 * 
 * // Only safe for small values
 * const small = await Effect.runPromise(Uint128.from(1000000000000n))
 * const num = Uint128.toNumber(small) // 1000000000000
 * 
 * // Warning: precision loss for large values!
 * const large = await Effect.runPromise(Uint128.from(2n ** 100n))
 * const lossy = Uint128.toNumber(large) // loses precision
 * ```
 * 
 * @see {@link toBigInt} for lossless conversion
 * 
 * @since 0.0.1
 */
export const toNumber = (value: Uint128Type): number => BrandedUint128.toNumber(value)

/**
 * Converts a Uint128 to a hex string.
 * 
 * @description
 * Converts a Uint128 to its hexadecimal string representation with '0x' prefix.
 * Result is 1-32 hex characters after the prefix.
 * 
 * @param value - Uint128 value to convert
 * @returns Hex string with 0x prefix (e.g., '0xffffffffffffffffffffffffffffffff')
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Uint128 from '@voltaire-effect/primitives/Uint128'
 * 
 * const value = await Effect.runPromise(Uint128.from(2n ** 128n - 1n))
 * const hex = Uint128.toHex(value) // '0xffffffffffffffffffffffffffffffff'
 * ```
 * 
 * @since 0.0.1
 */
export const toHex = (value: Uint128Type): string => BrandedUint128.toHex(value)

/**
 * Checks equality of two Uint128 values.
 * 
 * @description
 * Compares two Uint128 values for equality.
 * 
 * @param a - First Uint128 value
 * @param b - Second Uint128 value
 * @returns true if values are equal, false otherwise
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Uint128 from '@voltaire-effect/primitives/Uint128'
 * 
 * const a = await Effect.runPromise(Uint128.from(2n ** 100n))
 * const b = await Effect.runPromise(Uint128.from(2n ** 100n))
 * const c = await Effect.runPromise(Uint128.from(2n ** 99n))
 * 
 * Uint128.equals(a, b) // true
 * Uint128.equals(a, c) // false
 * ```
 * 
 * @since 0.0.1
 */
export const equals = (a: Uint128Type, b: Uint128Type): boolean => BrandedUint128.equals(a, b)

/**
 * Maximum Uint128 value.
 * 
 * @description
 * The maximum value representable by a 128-bit unsigned integer:
 * 340282366920938463463374607431768211455 (2^128 - 1).
 * 
 * @example
 * ```typescript
 * import * as Uint128 from '@voltaire-effect/primitives/Uint128'
 * 
 * console.log(Uint128.toBigInt(Uint128.MAX)) // 340282366920938463463374607431768211455n
 * ```
 * 
 * @since 0.0.1
 */
export const MAX = BrandedUint128.MAX

/**
 * Minimum Uint128 value.
 * 
 * @description
 * The minimum value representable by a 128-bit unsigned integer: 0.
 * 
 * @example
 * ```typescript
 * import * as Uint128 from '@voltaire-effect/primitives/Uint128'
 * 
 * console.log(Uint128.toBigInt(Uint128.MIN)) // 0n
 * ```
 * 
 * @since 0.0.1
 */
export const MIN = BrandedUint128.MIN

/**
 * Uint128 zero constant.
 * 
 * @description
 * Pre-constructed Uint128 representing the value 0.
 * 
 * @example
 * ```typescript
 * import * as Uint128 from '@voltaire-effect/primitives/Uint128'
 * 
 * console.log(Uint128.toBigInt(Uint128.ZERO)) // 0n
 * console.log(Uint128.equals(Uint128.ZERO, Uint128.MIN)) // true
 * ```
 * 
 * @since 0.0.1
 */
export const ZERO = BrandedUint128.ZERO

/**
 * Uint128 one constant.
 * 
 * @description
 * Pre-constructed Uint128 representing the value 1.
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Uint128 from '@voltaire-effect/primitives/Uint128'
 * 
 * const value = await Effect.runPromise(Uint128.from(2n ** 100n))
 * const incremented = await Effect.runPromise(Uint128.plus(value, Uint128.ONE))
 * ```
 * 
 * @since 0.0.1
 */
export const ONE = BrandedUint128.ONE
