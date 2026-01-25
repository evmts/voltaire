/**
 * @fileoverview Effect-based constructors and operations for Uint32 (32-bit unsigned integers).
 * 
 * Provides functional Effect wrappers around the core Uint32 primitives,
 * enabling safe error handling and composition in Effect pipelines.
 * All arithmetic operations include overflow/underflow checking.
 * 
 * @module Uint32/from
 * @since 0.0.1
 */

import { BrandedUint32 } from '@tevm/voltaire'
import type { Uint32Type } from './Uint32Schema.js'
import * as Effect from 'effect/Effect'

/**
 * Error thrown when Uint32 operations fail.
 * 
 * @description
 * Represents errors from Uint32 construction or arithmetic operations.
 * Common causes include:
 * - Value out of range (must be 0-4294967295)
 * - Arithmetic overflow (result > 4294967295)
 * - Arithmetic underflow (result < 0)
 * - Invalid input format
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Uint32 from '@voltaire-effect/primitives/Uint32'
 * 
 * const result = Effect.runSync(
 *   Effect.either(Uint32.from(4294967296)) // Error: value out of range
 * )
 * if (result._tag === 'Left') {
 *   console.log(result.left._tag) // 'Uint32Error'
 * }
 * ```
 * 
 * @since 0.0.1
 */
export class Uint32Error {
  /** Discriminant tag for error identification in Effect error handling */
  readonly _tag = 'Uint32Error'
  
  /**
   * Creates a new Uint32Error.
   * @param message - Description of what went wrong
   */
  constructor(readonly message: string) {}
}

/**
 * Creates a Uint32 from a number, bigint, or string.
 * 
 * @description
 * Parses the input value and creates a validated Uint32. The value must be
 * a non-negative integer within the range 0 to 4294967295 (inclusive).
 * 
 * Min value: 0
 * Max value: 4294967295 (2^32 - 1)
 * 
 * @param value - Value to convert (0-4294967295)
 * @returns Effect containing the Uint32 or Uint32Error if validation fails
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Uint32 from '@voltaire-effect/primitives/Uint32'
 * 
 * // From number
 * const value = await Effect.runPromise(Uint32.from(4294967295))
 * 
 * // From bigint
 * const fromBigInt = await Effect.runPromise(Uint32.from(3000000000n))
 * 
 * // From string
 * const fromString = await Effect.runPromise(Uint32.from('2147483648'))
 * 
 * // Error handling
 * const result = Effect.runSync(Effect.either(Uint32.from(4294967296)))
 * ```
 * 
 * @throws {Uint32Error} When value is negative
 * @throws {Uint32Error} When value exceeds 4294967295
 * @throws {Uint32Error} When string cannot be parsed
 * 
 * @see {@link MAX} for maximum value constant (4294967295)
 * @see {@link MIN} for minimum value constant (0)
 * 
 * @since 0.0.1
 */
export const from = (value: number | bigint | string): Effect.Effect<Uint32Type, Uint32Error> =>
  Effect.try({
    try: () => BrandedUint32.from(value),
    catch: (e) => new Uint32Error((e as Error).message)
  })

/**
 * Adds two Uint32 values with overflow checking.
 * 
 * @description
 * Performs checked addition of two Uint32 values. Returns an error if the
 * result would exceed 4294967295 (overflow).
 * 
 * @param a - First operand (augend)
 * @param b - Second operand (addend)
 * @returns Effect containing the sum or Uint32Error on overflow
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Uint32 from '@voltaire-effect/primitives/Uint32'
 * 
 * const a = await Effect.runPromise(Uint32.from(2000000000))
 * const b = await Effect.runPromise(Uint32.from(1000000000))
 * const sum = await Effect.runPromise(Uint32.plus(a, b)) // 3000000000
 * 
 * // Overflow error
 * const max = Uint32.MAX
 * const overflow = Effect.runSync(Effect.either(Uint32.plus(max, Uint32.ONE)))
 * // Left(Uint32Error)
 * ```
 * 
 * @throws {Uint32Error} When result exceeds 4294967295 (overflow)
 * 
 * @see {@link minus} for subtraction
 * @see {@link times} for multiplication
 * 
 * @since 0.0.1
 */
export const plus = (a: Uint32Type, b: Uint32Type): Effect.Effect<Uint32Type, Uint32Error> =>
  Effect.try({
    try: () => BrandedUint32.plus(a, b),
    catch: (e) => new Uint32Error((e as Error).message)
  })

/**
 * Subtracts two Uint32 values with underflow checking.
 * 
 * @description
 * Performs checked subtraction of two Uint32 values. Returns an error if the
 * result would be negative (underflow).
 * 
 * @param a - Minuend (value to subtract from)
 * @param b - Subtrahend (value to subtract)
 * @returns Effect containing the difference or Uint32Error on underflow
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Uint32 from '@voltaire-effect/primitives/Uint32'
 * 
 * const a = await Effect.runPromise(Uint32.from(3000000000))
 * const b = await Effect.runPromise(Uint32.from(1000000000))
 * const diff = await Effect.runPromise(Uint32.minus(a, b)) // 2000000000
 * 
 * // Underflow error
 * const underflow = Effect.runSync(Effect.either(Uint32.minus(b, a)))
 * // Left(Uint32Error)
 * ```
 * 
 * @throws {Uint32Error} When result would be negative (underflow)
 * 
 * @see {@link plus} for addition
 * @see {@link times} for multiplication
 * 
 * @since 0.0.1
 */
export const minus = (a: Uint32Type, b: Uint32Type): Effect.Effect<Uint32Type, Uint32Error> =>
  Effect.try({
    try: () => BrandedUint32.minus(a, b),
    catch: (e) => new Uint32Error((e as Error).message)
  })

/**
 * Multiplies two Uint32 values with overflow checking.
 * 
 * @description
 * Performs checked multiplication of two Uint32 values. Returns an error if
 * the result would exceed 4294967295 (overflow).
 * 
 * @param a - First operand (multiplicand)
 * @param b - Second operand (multiplier)
 * @returns Effect containing the product or Uint32Error on overflow
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Uint32 from '@voltaire-effect/primitives/Uint32'
 * 
 * const a = await Effect.runPromise(Uint32.from(50000))
 * const b = await Effect.runPromise(Uint32.from(80000))
 * const product = await Effect.runPromise(Uint32.times(a, b)) // 4000000000
 * 
 * // Overflow error (65536 * 65536 > 4294967295)
 * const c = await Effect.runPromise(Uint32.from(65536))
 * const overflow = Effect.runSync(Effect.either(Uint32.times(c, c)))
 * // Left(Uint32Error)
 * ```
 * 
 * @throws {Uint32Error} When result exceeds 4294967295 (overflow)
 * 
 * @see {@link plus} for addition
 * @see {@link minus} for subtraction
 * 
 * @since 0.0.1
 */
export const times = (a: Uint32Type, b: Uint32Type): Effect.Effect<Uint32Type, Uint32Error> =>
  Effect.try({
    try: () => BrandedUint32.times(a, b),
    catch: (e) => new Uint32Error((e as Error).message)
  })

/**
 * Converts a Uint32 to a JavaScript number.
 * 
 * @description
 * Extracts the numeric value from a Uint32. This is always safe as Uint32 values
 * (0-4294967295) are within JavaScript's safe integer range.
 * 
 * @param value - Uint32 value to convert
 * @returns The numeric value (0-4294967295)
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Uint32 from '@voltaire-effect/primitives/Uint32'
 * 
 * const value = await Effect.runPromise(Uint32.from(3000000000))
 * const num = Uint32.toNumber(value) // 3000000000
 * ```
 * 
 * @since 0.0.1
 */
export const toNumber = (value: Uint32Type): number => BrandedUint32.toNumber(value)

/**
 * Converts a Uint32 to a hex string.
 * 
 * @description
 * Converts a Uint32 to its hexadecimal string representation with '0x' prefix.
 * Result is 1-8 hex characters after the prefix.
 * 
 * @param value - Uint32 value to convert
 * @returns Hex string with 0x prefix (e.g., '0xffffffff')
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Uint32 from '@voltaire-effect/primitives/Uint32'
 * 
 * const value = await Effect.runPromise(Uint32.from(4294967295))
 * const hex = Uint32.toHex(value) // '0xffffffff'
 * ```
 * 
 * @since 0.0.1
 */
export const toHex = (value: Uint32Type): string => BrandedUint32.toHex(value)

/**
 * Checks equality of two Uint32 values.
 * 
 * @description
 * Compares two Uint32 values for equality.
 * 
 * @param a - First Uint32 value
 * @param b - Second Uint32 value
 * @returns true if values are equal, false otherwise
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Uint32 from '@voltaire-effect/primitives/Uint32'
 * 
 * const a = await Effect.runPromise(Uint32.from(1000000))
 * const b = await Effect.runPromise(Uint32.from(1000000))
 * const c = await Effect.runPromise(Uint32.from(2000000))
 * 
 * Uint32.equals(a, b) // true
 * Uint32.equals(a, c) // false
 * ```
 * 
 * @since 0.0.1
 */
export const equals = (a: Uint32Type, b: Uint32Type): boolean => BrandedUint32.equals(a, b)

/**
 * Maximum Uint32 value.
 * 
 * @description
 * The maximum value representable by a 32-bit unsigned integer: 4294967295 (2^32 - 1).
 * 
 * @example
 * ```typescript
 * import * as Uint32 from '@voltaire-effect/primitives/Uint32'
 * 
 * console.log(Uint32.toNumber(Uint32.MAX)) // 4294967295
 * ```
 * 
 * @since 0.0.1
 */
export const MAX = BrandedUint32.MAX

/**
 * Minimum Uint32 value.
 * 
 * @description
 * The minimum value representable by a 32-bit unsigned integer: 0.
 * 
 * @example
 * ```typescript
 * import * as Uint32 from '@voltaire-effect/primitives/Uint32'
 * 
 * console.log(Uint32.toNumber(Uint32.MIN)) // 0
 * ```
 * 
 * @since 0.0.1
 */
export const MIN = BrandedUint32.MIN

/**
 * Uint32 zero constant.
 * 
 * @description
 * Pre-constructed Uint32 representing the value 0.
 * 
 * @example
 * ```typescript
 * import * as Uint32 from '@voltaire-effect/primitives/Uint32'
 * 
 * console.log(Uint32.toNumber(Uint32.ZERO)) // 0
 * console.log(Uint32.equals(Uint32.ZERO, Uint32.MIN)) // true
 * ```
 * 
 * @since 0.0.1
 */
export const ZERO = BrandedUint32.ZERO

/**
 * Uint32 one constant.
 * 
 * @description
 * Pre-constructed Uint32 representing the value 1.
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Uint32 from '@voltaire-effect/primitives/Uint32'
 * 
 * const value = await Effect.runPromise(Uint32.from(1000000))
 * const incremented = await Effect.runPromise(Uint32.plus(value, Uint32.ONE)) // 1000001
 * ```
 * 
 * @since 0.0.1
 */
export const ONE = BrandedUint32.ONE
