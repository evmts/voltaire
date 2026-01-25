import { BrandedUint8 } from '@tevm/voltaire'
import type { Uint8Type } from './Uint8Schema.js'
import * as Effect from 'effect/Effect'

/**
 * Error thrown when Uint8 operations fail.
 * @since 0.0.1
 */
export class Uint8Error {
  /** Discriminant tag for error identification */
  readonly _tag = 'Uint8Error'
  constructor(readonly message: string) {}
}

/**
 * Creates a Uint8 from a number or string.
 * @param value - Value to convert (0-255)
 * @returns Effect containing the Uint8 or Uint8Error
 * @since 0.0.1
 */
export const from = (value: number | string): Effect.Effect<Uint8Type, Uint8Error> =>
  Effect.try({
    try: () => BrandedUint8.from(value),
    catch: (e) => new Uint8Error((e as Error).message)
  })

/**
 * Adds two Uint8 values with overflow checking.
 * @param a - First operand
 * @param b - Second operand
 * @returns Effect containing the sum or Uint8Error on overflow
 * @since 0.0.1
 */
export const plus = (a: Uint8Type, b: Uint8Type): Effect.Effect<Uint8Type, Uint8Error> =>
  Effect.try({
    try: () => BrandedUint8.plus(a, b),
    catch: (e) => new Uint8Error((e as Error).message)
  })

/**
 * Subtracts two Uint8 values with underflow checking.
 * @param a - Minuend
 * @param b - Subtrahend
 * @returns Effect containing the difference or Uint8Error on underflow
 * @since 0.0.1
 */
export const minus = (a: Uint8Type, b: Uint8Type): Effect.Effect<Uint8Type, Uint8Error> =>
  Effect.try({
    try: () => BrandedUint8.minus(a, b),
    catch: (e) => new Uint8Error((e as Error).message)
  })

/**
 * Multiplies two Uint8 values with overflow checking.
 * @param a - First operand
 * @param b - Second operand
 * @returns Effect containing the product or Uint8Error on overflow
 * @since 0.0.1
 */
export const times = (a: Uint8Type, b: Uint8Type): Effect.Effect<Uint8Type, Uint8Error> =>
  Effect.try({
    try: () => BrandedUint8.times(a, b),
    catch: (e) => new Uint8Error((e as Error).message)
  })

/** Converts a Uint8 to a number. @since 0.0.1 */
export const toNumber = (value: Uint8Type): number => BrandedUint8.toNumber(value)

/** Converts a Uint8 to a hex string. @since 0.0.1 */
export const toHex = (value: Uint8Type): string => BrandedUint8.toHex(value)

/** Checks equality of two Uint8 values. @since 0.0.1 */
export const equals = (a: Uint8Type, b: Uint8Type): boolean => BrandedUint8.equals(a, b)

/** Maximum Uint8 value (255). @since 0.0.1 */
export const MAX = BrandedUint8.MAX

/** Minimum Uint8 value (0). @since 0.0.1 */
export const MIN = BrandedUint8.MIN

/** Uint8 zero constant. @since 0.0.1 */
export const ZERO = BrandedUint8.ZERO

/** Uint8 one constant. @since 0.0.1 */
export const ONE = BrandedUint8.ONE
