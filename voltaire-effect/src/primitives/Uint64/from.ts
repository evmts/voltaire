/**
 * @fileoverview Effect-based constructors and operations for Uint64 (64-bit unsigned integers).
 * 
 * Provides functional Effect wrappers around the core Uint64 primitives,
 * enabling safe error handling and composition in Effect pipelines.
 * All arithmetic operations include overflow/underflow checking.
 * 
 * @module Uint64/from
 * @since 0.0.1
 */

import { Uint64 } from '@tevm/voltaire'
import type { Uint64Type } from './Uint64Schema.js'
import * as Effect from 'effect/Effect'

/**
 * Error thrown when Uint64 operations fail.
 * 
 * @description
 * Represents errors from Uint64 construction or arithmetic operations.
 * Common causes include:
 * - Value out of range (must be 0 to 2^64-1)
 * - Arithmetic overflow (result > 2^64-1)
 * - Arithmetic underflow (result < 0)
 * - Invalid input format
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Uint64 from '@voltaire-effect/primitives/Uint64'
 * 
 * const result = Effect.runSync(
 *   Effect.either(Uint64.from(-1n)) // Error: value out of range
 * )
 * if (result._tag === 'Left') {
 *   console.log(result.left._tag) // 'Uint64Error'
 * }
 * ```
 * 
 * @since 0.0.1
 */
export class Uint64Error {
  /** Discriminant tag for error identification in Effect error handling */
  readonly _tag = 'Uint64Error'
  
  /**
   * Creates a new Uint64Error.
   * @param message - Description of what went wrong
   */
  constructor(readonly message: string) {}
}

/**
 * Creates a Uint64 from a number, bigint, or string.
 * 
 * @description
 * Parses the input value and creates a validated Uint64. The value must be
 * a non-negative integer within the range 0 to 2^64-1 (18446744073709551615).
 * 
 * Min value: 0
 * Max value: 18446744073709551615 (2^64 - 1)
 * 
 * @param value - Value to convert (0 to 2^64-1)
 * @returns Effect containing the Uint64 or Uint64Error if validation fails
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Uint64 from '@voltaire-effect/primitives/Uint64'
 * 
 * // From bigint
 * const value = await Effect.runPromise(Uint64.from(18446744073709551615n))
 * 
 * // From number (for safe integers)
 * const fromNumber = await Effect.runPromise(Uint64.from(1000000000000))
 * 
 * // From string
 * const fromString = await Effect.runPromise(Uint64.from('9223372036854775808'))
 * 
 * // Error handling
 * const result = Effect.runSync(Effect.either(Uint64.from(-1)))
 * ```
 * 
 * @throws {Uint64Error} When value is negative
 * @throws {Uint64Error} When value exceeds 2^64-1
 * @throws {Uint64Error} When string cannot be parsed
 * 
 * @see {@link MAX} for maximum value constant (2^64-1)
 * @see {@link MIN} for minimum value constant (0)
 * 
 * @since 0.0.1
 */
export const from = (value: number | bigint | string): Effect.Effect<Uint64Type, Uint64Error> =>
  Effect.try({
    try: () => Uint64.from(value),
    catch: (e) => new Uint64Error((e as Error).message)
  })

/**
 * Adds two Uint64 values with overflow checking.
 * 
 * @description
 * Performs checked addition of two Uint64 values. Returns an error if the
 * result would exceed 2^64-1 (overflow).
 * 
 * @param a - First operand (augend)
 * @param b - Second operand (addend)
 * @returns Effect containing the sum or Uint64Error on overflow
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Uint64 from '@voltaire-effect/primitives/Uint64'
 * 
 * const a = await Effect.runPromise(Uint64.from(10000000000000000000n))
 * const b = await Effect.runPromise(Uint64.from(5000000000000000000n))
 * const sum = await Effect.runPromise(Uint64.plus(a, b)) // 15000000000000000000n
 * 
 * // Overflow error
 * const max = Uint64.MAX
 * const overflow = Effect.runSync(Effect.either(Uint64.plus(max, Uint64.ONE)))
 * // Left(Uint64Error)
 * ```
 * 
 * @throws {Uint64Error} When result exceeds 2^64-1 (overflow)
 * 
 * @see {@link minus} for subtraction
 * @see {@link times} for multiplication
 * 
 * @since 0.0.1
 */
export const plus = (a: Uint64Type, b: Uint64Type): Effect.Effect<Uint64Type, Uint64Error> =>
  Effect.try({
    try: () => Uint64.plus(a, b),
    catch: (e) => new Uint64Error((e as Error).message)
  })

/**
 * Subtracts two Uint64 values with underflow checking.
 * 
 * @description
 * Performs checked subtraction of two Uint64 values. Returns an error if the
 * result would be negative (underflow).
 * 
 * @param a - Minuend (value to subtract from)
 * @param b - Subtrahend (value to subtract)
 * @returns Effect containing the difference or Uint64Error on underflow
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Uint64 from '@voltaire-effect/primitives/Uint64'
 * 
 * const a = await Effect.runPromise(Uint64.from(15000000000000000000n))
 * const b = await Effect.runPromise(Uint64.from(5000000000000000000n))
 * const diff = await Effect.runPromise(Uint64.minus(a, b)) // 10000000000000000000n
 * 
 * // Underflow error
 * const underflow = Effect.runSync(Effect.either(Uint64.minus(b, a)))
 * // Left(Uint64Error)
 * ```
 * 
 * @throws {Uint64Error} When result would be negative (underflow)
 * 
 * @see {@link plus} for addition
 * @see {@link times} for multiplication
 * 
 * @since 0.0.1
 */
export const minus = (a: Uint64Type, b: Uint64Type): Effect.Effect<Uint64Type, Uint64Error> =>
  Effect.try({
    try: () => Uint64.minus(a, b),
    catch: (e) => new Uint64Error((e as Error).message)
  })

/**
 * Multiplies two Uint64 values with overflow checking.
 * 
 * @description
 * Performs checked multiplication of two Uint64 values. Returns an error if
 * the result would exceed 2^64-1 (overflow).
 * 
 * @param a - First operand (multiplicand)
 * @param b - Second operand (multiplier)
 * @returns Effect containing the product or Uint64Error on overflow
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Uint64 from '@voltaire-effect/primitives/Uint64'
 * 
 * const a = await Effect.runPromise(Uint64.from(1000000000n))
 * const b = await Effect.runPromise(Uint64.from(1000000000n))
 * const product = await Effect.runPromise(Uint64.times(a, b)) // 1000000000000000000n
 * 
 * // Overflow error
 * const large = await Effect.runPromise(Uint64.from(2n ** 32n))
 * const overflow = Effect.runSync(Effect.either(Uint64.times(large, large)))
 * // Left(Uint64Error)
 * ```
 * 
 * @throws {Uint64Error} When result exceeds 2^64-1 (overflow)
 * 
 * @see {@link plus} for addition
 * @see {@link minus} for subtraction
 * 
 * @since 0.0.1
 */
export const times = (a: Uint64Type, b: Uint64Type): Effect.Effect<Uint64Type, Uint64Error> =>
  Effect.try({
    try: () => Uint64.times(a, b),
    catch: (e) => new Uint64Error((e as Error).message)
  })

/**
 * Converts a Uint64 to a bigint.
 * 
 * @description
 * Extracts the bigint value from a Uint64. Use this for values that may
 * exceed JavaScript's safe integer range.
 * 
 * @param value - Uint64 value to convert
 * @returns The bigint value (0n to 2^64-1)
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Uint64 from '@voltaire-effect/primitives/Uint64'
 * 
 * const value = await Effect.runPromise(Uint64.from(18446744073709551615n))
 * const bigint = Uint64.toBigInt(value) // 18446744073709551615n
 * ```
 * 
 * @see {@link toNumber} for values within safe integer range
 * 
 * @since 0.0.1
 */
export const toBigInt = (value: Uint64Type): bigint => Uint64.toBigInt(value)

/**
 * Converts a Uint64 to a JavaScript number.
 * 
 * @description
 * Extracts the numeric value from a Uint64. Warning: This may lose precision
 * for values larger than Number.MAX_SAFE_INTEGER (2^53-1). Use {@link toBigInt}
 * for large values.
 * 
 * @param value - Uint64 value to convert
 * @returns The numeric value (may lose precision for large values)
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Uint64 from '@voltaire-effect/primitives/Uint64'
 * 
 * const value = await Effect.runPromise(Uint64.from(1000000000000n))
 * const num = Uint64.toNumber(value) // 1000000000000
 * 
 * // Warning: precision loss for large values
 * const large = await Effect.runPromise(Uint64.from(18446744073709551615n))
 * const lossy = Uint64.toNumber(large) // loses precision!
 * ```
 * 
 * @see {@link toBigInt} for lossless conversion
 * 
 * @since 0.0.1
 */
export const toNumber = (value: Uint64Type): number => Uint64.toNumber(value)

/**
 * Converts a Uint64 to a hex string.
 * 
 * @description
 * Converts a Uint64 to its hexadecimal string representation with '0x' prefix.
 * Result is 1-16 hex characters after the prefix.
 * 
 * @param value - Uint64 value to convert
 * @returns Hex string with 0x prefix (e.g., '0xffffffffffffffff')
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Uint64 from '@voltaire-effect/primitives/Uint64'
 * 
 * const value = await Effect.runPromise(Uint64.from(18446744073709551615n))
 * const hex = Uint64.toHex(value) // '0xffffffffffffffff'
 * ```
 * 
 * @since 0.0.1
 */
export const toHex = (value: Uint64Type): string => Uint64.toHex(value)

/**
 * Checks equality of two Uint64 values.
 * 
 * @description
 * Compares two Uint64 values for equality.
 * 
 * @param a - First Uint64 value
 * @param b - Second Uint64 value
 * @returns true if values are equal, false otherwise
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Uint64 from '@voltaire-effect/primitives/Uint64'
 * 
 * const a = await Effect.runPromise(Uint64.from(1000000000000n))
 * const b = await Effect.runPromise(Uint64.from(1000000000000n))
 * const c = await Effect.runPromise(Uint64.from(2000000000000n))
 * 
 * Uint64.equals(a, b) // true
 * Uint64.equals(a, c) // false
 * ```
 * 
 * @since 0.0.1
 */
export const equals = (a: Uint64Type, b: Uint64Type): boolean => Uint64.equals(a, b)

/**
 * Maximum Uint64 value.
 * 
 * @description
 * The maximum value representable by a 64-bit unsigned integer:
 * 18446744073709551615 (2^64 - 1).
 * 
 * @example
 * ```typescript
 * import * as Uint64 from '@voltaire-effect/primitives/Uint64'
 * 
 * console.log(Uint64.toBigInt(Uint64.MAX)) // 18446744073709551615n
 * ```
 * 
 * @since 0.0.1
 */
export const MAX = Uint64.MAX

/**
 * Minimum Uint64 value.
 * 
 * @description
 * The minimum value representable by a 64-bit unsigned integer: 0.
 * 
 * @example
 * ```typescript
 * import * as Uint64 from '@voltaire-effect/primitives/Uint64'
 * 
 * console.log(Uint64.toBigInt(Uint64.MIN)) // 0n
 * ```
 * 
 * @since 0.0.1
 */
export const MIN = Uint64.MIN

/**
 * Uint64 zero constant.
 * 
 * @description
 * Pre-constructed Uint64 representing the value 0.
 * 
 * @example
 * ```typescript
 * import * as Uint64 from '@voltaire-effect/primitives/Uint64'
 * 
 * console.log(Uint64.toBigInt(Uint64.ZERO)) // 0n
 * console.log(Uint64.equals(Uint64.ZERO, Uint64.MIN)) // true
 * ```
 * 
 * @since 0.0.1
 */
export const ZERO = Uint64.ZERO

/**
 * Uint64 one constant.
 * 
 * @description
 * Pre-constructed Uint64 representing the value 1.
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Uint64 from '@voltaire-effect/primitives/Uint64'
 * 
 * const value = await Effect.runPromise(Uint64.from(1000000000000n))
 * const incremented = await Effect.runPromise(Uint64.plus(value, Uint64.ONE)) // 1000000000001n
 * ```
 * 
 * @since 0.0.1
 */
export const ONE = Uint64.ONE
