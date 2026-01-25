/**
 * @fileoverview Effect-based constructors and operations for Uint8 (8-bit unsigned integers).
 * 
 * Provides functional Effect wrappers around the core Uint8 primitives,
 * enabling safe error handling and composition in Effect pipelines.
 * All arithmetic operations include overflow/underflow checking.
 * 
 * @module Uint8/from
 * @since 0.0.1
 */

import { BrandedUint8 } from '@tevm/voltaire'
import type { Uint8Type } from './Uint8Schema.js'
import * as Effect from 'effect/Effect'

/**
 * Error thrown when Uint8 operations fail.
 * 
 * @description
 * Represents errors from Uint8 construction or arithmetic operations.
 * Common causes include:
 * - Value out of range (must be 0-255)
 * - Arithmetic overflow (result > 255)
 * - Arithmetic underflow (result < 0)
 * - Invalid input format
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Uint8 from '@voltaire-effect/primitives/Uint8'
 * 
 * const result = Effect.runSync(
 *   Effect.either(Uint8.from(256)) // Error: value out of range
 * )
 * if (result._tag === 'Left') {
 *   console.log(result.left._tag) // 'Uint8Error'
 * }
 * ```
 * 
 * @since 0.0.1
 */
export class Uint8Error {
  /** Discriminant tag for error identification in Effect error handling */
  readonly _tag = 'Uint8Error'
  
  /**
   * Creates a new Uint8Error.
   * @param message - Description of what went wrong
   */
  constructor(readonly message: string) {}
}

/**
 * Creates a Uint8 from a number or string.
 * 
 * @description
 * Parses the input value and creates a validated Uint8. The value must be
 * a non-negative integer within the range 0 to 255 (inclusive).
 * 
 * Min value: 0
 * Max value: 255
 * 
 * @param value - Value to convert (0-255)
 * @returns Effect containing the Uint8 or Uint8Error if validation fails
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Uint8 from '@voltaire-effect/primitives/Uint8'
 * 
 * // From number
 * const value = await Effect.runPromise(Uint8.from(255))
 * 
 * // From string
 * const fromString = await Effect.runPromise(Uint8.from('128'))
 * 
 * // Error handling
 * const result = Effect.runSync(Effect.either(Uint8.from(256)))
 * ```
 * 
 * @throws {Uint8Error} When value is negative
 * @throws {Uint8Error} When value exceeds 255
 * @throws {Uint8Error} When string cannot be parsed
 * 
 * @see {@link MAX} for maximum value constant (255)
 * @see {@link MIN} for minimum value constant (0)
 * 
 * @since 0.0.1
 */
export const from = (value: number | string): Effect.Effect<Uint8Type, Uint8Error> =>
  Effect.try({
    try: () => BrandedUint8.from(value),
    catch: (e) => new Uint8Error((e as Error).message)
  })

/**
 * Adds two Uint8 values with overflow checking.
 * 
 * @description
 * Performs checked addition of two Uint8 values. Returns an error if the
 * result would exceed 255 (overflow).
 * 
 * @param a - First operand (augend)
 * @param b - Second operand (addend)
 * @returns Effect containing the sum or Uint8Error on overflow
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Uint8 from '@voltaire-effect/primitives/Uint8'
 * 
 * const a = await Effect.runPromise(Uint8.from(100))
 * const b = await Effect.runPromise(Uint8.from(50))
 * const sum = await Effect.runPromise(Uint8.plus(a, b)) // 150
 * 
 * // Overflow error
 * const max = Uint8.MAX
 * const overflow = Effect.runSync(Effect.either(Uint8.plus(max, Uint8.ONE)))
 * // Left(Uint8Error)
 * ```
 * 
 * @throws {Uint8Error} When result exceeds 255 (overflow)
 * 
 * @see {@link minus} for subtraction
 * @see {@link times} for multiplication
 * 
 * @since 0.0.1
 */
export const plus = (a: Uint8Type, b: Uint8Type): Effect.Effect<Uint8Type, Uint8Error> =>
  Effect.try({
    try: () => BrandedUint8.plus(a, b),
    catch: (e) => new Uint8Error((e as Error).message)
  })

/**
 * Subtracts two Uint8 values with underflow checking.
 * 
 * @description
 * Performs checked subtraction of two Uint8 values. Returns an error if the
 * result would be negative (underflow).
 * 
 * @param a - Minuend (value to subtract from)
 * @param b - Subtrahend (value to subtract)
 * @returns Effect containing the difference or Uint8Error on underflow
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Uint8 from '@voltaire-effect/primitives/Uint8'
 * 
 * const a = await Effect.runPromise(Uint8.from(100))
 * const b = await Effect.runPromise(Uint8.from(50))
 * const diff = await Effect.runPromise(Uint8.minus(a, b)) // 50
 * 
 * // Underflow error
 * const underflow = Effect.runSync(Effect.either(Uint8.minus(b, a)))
 * // Left(Uint8Error)
 * ```
 * 
 * @throws {Uint8Error} When result would be negative (underflow)
 * 
 * @see {@link plus} for addition
 * @see {@link times} for multiplication
 * 
 * @since 0.0.1
 */
export const minus = (a: Uint8Type, b: Uint8Type): Effect.Effect<Uint8Type, Uint8Error> =>
  Effect.try({
    try: () => BrandedUint8.minus(a, b),
    catch: (e) => new Uint8Error((e as Error).message)
  })

/**
 * Multiplies two Uint8 values with overflow checking.
 * 
 * @description
 * Performs checked multiplication of two Uint8 values. Returns an error if
 * the result would exceed 255 (overflow).
 * 
 * @param a - First operand (multiplicand)
 * @param b - Second operand (multiplier)
 * @returns Effect containing the product or Uint8Error on overflow
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Uint8 from '@voltaire-effect/primitives/Uint8'
 * 
 * const a = await Effect.runPromise(Uint8.from(10))
 * const b = await Effect.runPromise(Uint8.from(20))
 * const product = await Effect.runPromise(Uint8.times(a, b)) // 200
 * 
 * // Overflow error (16 * 16 = 256 > 255)
 * const c = await Effect.runPromise(Uint8.from(16))
 * const overflow = Effect.runSync(Effect.either(Uint8.times(c, c)))
 * // Left(Uint8Error)
 * ```
 * 
 * @throws {Uint8Error} When result exceeds 255 (overflow)
 * 
 * @see {@link plus} for addition
 * @see {@link minus} for subtraction
 * 
 * @since 0.0.1
 */
export const times = (a: Uint8Type, b: Uint8Type): Effect.Effect<Uint8Type, Uint8Error> =>
  Effect.try({
    try: () => BrandedUint8.times(a, b),
    catch: (e) => new Uint8Error((e as Error).message)
  })

/**
 * Converts a Uint8 to a JavaScript number.
 * 
 * @description
 * Extracts the numeric value from a Uint8. This is always safe as Uint8 values
 * (0-255) are well within JavaScript's safe integer range.
 * 
 * @param value - Uint8 value to convert
 * @returns The numeric value (0-255)
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Uint8 from '@voltaire-effect/primitives/Uint8'
 * 
 * const value = await Effect.runPromise(Uint8.from(42))
 * const num = Uint8.toNumber(value) // 42
 * ```
 * 
 * @since 0.0.1
 */
export const toNumber = (value: Uint8Type): number => BrandedUint8.toNumber(value)

/**
 * Converts a Uint8 to a hex string.
 * 
 * @description
 * Converts a Uint8 to its hexadecimal string representation with '0x' prefix.
 * Result is 1-2 hex characters after the prefix.
 * 
 * @param value - Uint8 value to convert
 * @returns Hex string with 0x prefix (e.g., '0xff')
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Uint8 from '@voltaire-effect/primitives/Uint8'
 * 
 * const value = await Effect.runPromise(Uint8.from(255))
 * const hex = Uint8.toHex(value) // '0xff'
 * ```
 * 
 * @since 0.0.1
 */
export const toHex = (value: Uint8Type): string => BrandedUint8.toHex(value)

/**
 * Checks equality of two Uint8 values.
 * 
 * @description
 * Compares two Uint8 values for equality.
 * 
 * @param a - First Uint8 value
 * @param b - Second Uint8 value
 * @returns true if values are equal, false otherwise
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Uint8 from '@voltaire-effect/primitives/Uint8'
 * 
 * const a = await Effect.runPromise(Uint8.from(42))
 * const b = await Effect.runPromise(Uint8.from(42))
 * const c = await Effect.runPromise(Uint8.from(100))
 * 
 * Uint8.equals(a, b) // true
 * Uint8.equals(a, c) // false
 * ```
 * 
 * @since 0.0.1
 */
export const equals = (a: Uint8Type, b: Uint8Type): boolean => BrandedUint8.equals(a, b)

/**
 * Maximum Uint8 value.
 * 
 * @description
 * The maximum value representable by an 8-bit unsigned integer: 255 (2^8 - 1).
 * 
 * @example
 * ```typescript
 * import * as Uint8 from '@voltaire-effect/primitives/Uint8'
 * 
 * console.log(Uint8.toNumber(Uint8.MAX)) // 255
 * ```
 * 
 * @since 0.0.1
 */
export const MAX = BrandedUint8.MAX

/**
 * Minimum Uint8 value.
 * 
 * @description
 * The minimum value representable by an 8-bit unsigned integer: 0.
 * 
 * @example
 * ```typescript
 * import * as Uint8 from '@voltaire-effect/primitives/Uint8'
 * 
 * console.log(Uint8.toNumber(Uint8.MIN)) // 0
 * ```
 * 
 * @since 0.0.1
 */
export const MIN = BrandedUint8.MIN

/**
 * Uint8 zero constant.
 * 
 * @description
 * Pre-constructed Uint8 representing the value 0.
 * 
 * @example
 * ```typescript
 * import * as Uint8 from '@voltaire-effect/primitives/Uint8'
 * 
 * console.log(Uint8.toNumber(Uint8.ZERO)) // 0
 * console.log(Uint8.equals(Uint8.ZERO, Uint8.MIN)) // true
 * ```
 * 
 * @since 0.0.1
 */
export const ZERO = BrandedUint8.ZERO

/**
 * Uint8 one constant.
 * 
 * @description
 * Pre-constructed Uint8 representing the value 1.
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Uint8 from '@voltaire-effect/primitives/Uint8'
 * 
 * const value = await Effect.runPromise(Uint8.from(10))
 * const incremented = await Effect.runPromise(Uint8.plus(value, Uint8.ONE)) // 11
 * ```
 * 
 * @since 0.0.1
 */
export const ONE = BrandedUint8.ONE
