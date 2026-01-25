/**
 * @fileoverview Effect-based constructors and operations for Uint16 (16-bit unsigned integers).
 * 
 * Provides functional Effect wrappers around the core Uint16 primitives,
 * enabling safe error handling and composition in Effect pipelines.
 * All arithmetic operations include overflow/underflow checking.
 * 
 * @module Uint16/from
 * @since 0.0.1
 */

import { BrandedUint16 } from '@tevm/voltaire'
import type { Uint16Type } from './Uint16Schema.js'
import * as Effect from 'effect/Effect'

/**
 * Error thrown when Uint16 operations fail.
 * 
 * @description
 * Represents errors from Uint16 construction or arithmetic operations.
 * Common causes include:
 * - Value out of range (must be 0-65535)
 * - Arithmetic overflow (result > 65535)
 * - Arithmetic underflow (result < 0)
 * - Invalid input format
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Uint16 from '@voltaire-effect/primitives/Uint16'
 * 
 * const result = Effect.runSync(
 *   Effect.either(Uint16.from(65536)) // Error: value out of range
 * )
 * if (result._tag === 'Left') {
 *   console.log(result.left._tag) // 'Uint16Error'
 * }
 * ```
 * 
 * @since 0.0.1
 */
export class Uint16Error {
  /** Discriminant tag for error identification in Effect error handling */
  readonly _tag = 'Uint16Error'
  
  /**
   * Creates a new Uint16Error.
   * @param message - Description of what went wrong
   */
  constructor(readonly message: string) {}
}

/**
 * Creates a Uint16 from a number or string.
 * 
 * @description
 * Parses the input value and creates a validated Uint16. The value must be
 * a non-negative integer within the range 0 to 65535 (inclusive).
 * 
 * Min value: 0
 * Max value: 65535 (2^16 - 1)
 * 
 * @param value - Value to convert (0-65535)
 * @returns Effect containing the Uint16 or Uint16Error if validation fails
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Uint16 from '@voltaire-effect/primitives/Uint16'
 * 
 * // From number
 * const value = await Effect.runPromise(Uint16.from(65535))
 * 
 * // From string
 * const fromString = await Effect.runPromise(Uint16.from('32768'))
 * 
 * // Error handling
 * const result = Effect.runSync(Effect.either(Uint16.from(65536)))
 * ```
 * 
 * @throws {Uint16Error} When value is negative
 * @throws {Uint16Error} When value exceeds 65535
 * @throws {Uint16Error} When string cannot be parsed
 * 
 * @see {@link MAX} for maximum value constant (65535)
 * @see {@link MIN} for minimum value constant (0)
 * 
 * @since 0.0.1
 */
export const from = (value: number | string): Effect.Effect<Uint16Type, Uint16Error> =>
  Effect.try({
    try: () => BrandedUint16.from(value),
    catch: (e) => new Uint16Error((e as Error).message)
  })

/**
 * Adds two Uint16 values with overflow checking.
 * 
 * @description
 * Performs checked addition of two Uint16 values. Returns an error if the
 * result would exceed 65535 (overflow).
 * 
 * @param a - First operand (augend)
 * @param b - Second operand (addend)
 * @returns Effect containing the sum or Uint16Error on overflow
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Uint16 from '@voltaire-effect/primitives/Uint16'
 * 
 * const a = await Effect.runPromise(Uint16.from(30000))
 * const b = await Effect.runPromise(Uint16.from(20000))
 * const sum = await Effect.runPromise(Uint16.plus(a, b)) // 50000
 * 
 * // Overflow error
 * const max = Uint16.MAX
 * const overflow = Effect.runSync(Effect.either(Uint16.plus(max, Uint16.ONE)))
 * // Left(Uint16Error)
 * ```
 * 
 * @throws {Uint16Error} When result exceeds 65535 (overflow)
 * 
 * @see {@link minus} for subtraction
 * @see {@link times} for multiplication
 * 
 * @since 0.0.1
 */
export const plus = (a: Uint16Type, b: Uint16Type): Effect.Effect<Uint16Type, Uint16Error> =>
  Effect.try({
    try: () => BrandedUint16.plus(a, b),
    catch: (e) => new Uint16Error((e as Error).message)
  })

/**
 * Subtracts two Uint16 values with underflow checking.
 * 
 * @description
 * Performs checked subtraction of two Uint16 values. Returns an error if the
 * result would be negative (underflow).
 * 
 * @param a - Minuend (value to subtract from)
 * @param b - Subtrahend (value to subtract)
 * @returns Effect containing the difference or Uint16Error on underflow
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Uint16 from '@voltaire-effect/primitives/Uint16'
 * 
 * const a = await Effect.runPromise(Uint16.from(50000))
 * const b = await Effect.runPromise(Uint16.from(20000))
 * const diff = await Effect.runPromise(Uint16.minus(a, b)) // 30000
 * 
 * // Underflow error
 * const underflow = Effect.runSync(Effect.either(Uint16.minus(b, a)))
 * // Left(Uint16Error)
 * ```
 * 
 * @throws {Uint16Error} When result would be negative (underflow)
 * 
 * @see {@link plus} for addition
 * @see {@link times} for multiplication
 * 
 * @since 0.0.1
 */
export const minus = (a: Uint16Type, b: Uint16Type): Effect.Effect<Uint16Type, Uint16Error> =>
  Effect.try({
    try: () => BrandedUint16.minus(a, b),
    catch: (e) => new Uint16Error((e as Error).message)
  })

/**
 * Multiplies two Uint16 values with overflow checking.
 * 
 * @description
 * Performs checked multiplication of two Uint16 values. Returns an error if
 * the result would exceed 65535 (overflow).
 * 
 * @param a - First operand (multiplicand)
 * @param b - Second operand (multiplier)
 * @returns Effect containing the product or Uint16Error on overflow
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Uint16 from '@voltaire-effect/primitives/Uint16'
 * 
 * const a = await Effect.runPromise(Uint16.from(200))
 * const b = await Effect.runPromise(Uint16.from(300))
 * const product = await Effect.runPromise(Uint16.times(a, b)) // 60000
 * 
 * // Overflow error (256 * 256 = 65536 > 65535)
 * const c = await Effect.runPromise(Uint16.from(256))
 * const overflow = Effect.runSync(Effect.either(Uint16.times(c, c)))
 * // Left(Uint16Error)
 * ```
 * 
 * @throws {Uint16Error} When result exceeds 65535 (overflow)
 * 
 * @see {@link plus} for addition
 * @see {@link minus} for subtraction
 * 
 * @since 0.0.1
 */
export const times = (a: Uint16Type, b: Uint16Type): Effect.Effect<Uint16Type, Uint16Error> =>
  Effect.try({
    try: () => BrandedUint16.times(a, b),
    catch: (e) => new Uint16Error((e as Error).message)
  })

/**
 * Converts a Uint16 to a JavaScript number.
 * 
 * @description
 * Extracts the numeric value from a Uint16. This is always safe as Uint16 values
 * (0-65535) are well within JavaScript's safe integer range.
 * 
 * @param value - Uint16 value to convert
 * @returns The numeric value (0-65535)
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Uint16 from '@voltaire-effect/primitives/Uint16'
 * 
 * const value = await Effect.runPromise(Uint16.from(42000))
 * const num = Uint16.toNumber(value) // 42000
 * ```
 * 
 * @since 0.0.1
 */
export const toNumber = (value: Uint16Type): number => BrandedUint16.toNumber(value)

/**
 * Converts a Uint16 to a hex string.
 * 
 * @description
 * Converts a Uint16 to its hexadecimal string representation with '0x' prefix.
 * Result is 1-4 hex characters after the prefix.
 * 
 * @param value - Uint16 value to convert
 * @returns Hex string with 0x prefix (e.g., '0xffff')
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Uint16 from '@voltaire-effect/primitives/Uint16'
 * 
 * const value = await Effect.runPromise(Uint16.from(65535))
 * const hex = Uint16.toHex(value) // '0xffff'
 * ```
 * 
 * @since 0.0.1
 */
export const toHex = (value: Uint16Type): string => BrandedUint16.toHex(value)

/**
 * Checks equality of two Uint16 values.
 * 
 * @description
 * Compares two Uint16 values for equality.
 * 
 * @param a - First Uint16 value
 * @param b - Second Uint16 value
 * @returns true if values are equal, false otherwise
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Uint16 from '@voltaire-effect/primitives/Uint16'
 * 
 * const a = await Effect.runPromise(Uint16.from(1000))
 * const b = await Effect.runPromise(Uint16.from(1000))
 * const c = await Effect.runPromise(Uint16.from(2000))
 * 
 * Uint16.equals(a, b) // true
 * Uint16.equals(a, c) // false
 * ```
 * 
 * @since 0.0.1
 */
export const equals = (a: Uint16Type, b: Uint16Type): boolean => BrandedUint16.equals(a, b)

/**
 * Maximum Uint16 value.
 * 
 * @description
 * The maximum value representable by a 16-bit unsigned integer: 65535 (2^16 - 1).
 * 
 * @example
 * ```typescript
 * import * as Uint16 from '@voltaire-effect/primitives/Uint16'
 * 
 * console.log(Uint16.toNumber(Uint16.MAX)) // 65535
 * ```
 * 
 * @since 0.0.1
 */
export const MAX = BrandedUint16.MAX

/**
 * Minimum Uint16 value.
 * 
 * @description
 * The minimum value representable by a 16-bit unsigned integer: 0.
 * 
 * @example
 * ```typescript
 * import * as Uint16 from '@voltaire-effect/primitives/Uint16'
 * 
 * console.log(Uint16.toNumber(Uint16.MIN)) // 0
 * ```
 * 
 * @since 0.0.1
 */
export const MIN = BrandedUint16.MIN

/**
 * Uint16 zero constant.
 * 
 * @description
 * Pre-constructed Uint16 representing the value 0.
 * 
 * @example
 * ```typescript
 * import * as Uint16 from '@voltaire-effect/primitives/Uint16'
 * 
 * console.log(Uint16.toNumber(Uint16.ZERO)) // 0
 * console.log(Uint16.equals(Uint16.ZERO, Uint16.MIN)) // true
 * ```
 * 
 * @since 0.0.1
 */
export const ZERO = BrandedUint16.ZERO

/**
 * Uint16 one constant.
 * 
 * @description
 * Pre-constructed Uint16 representing the value 1.
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Uint16 from '@voltaire-effect/primitives/Uint16'
 * 
 * const value = await Effect.runPromise(Uint16.from(1000))
 * const incremented = await Effect.runPromise(Uint16.plus(value, Uint16.ONE)) // 1001
 * ```
 * 
 * @since 0.0.1
 */
export const ONE = BrandedUint16.ONE
