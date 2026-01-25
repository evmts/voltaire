import { BrandedUint128 } from '@tevm/voltaire'
import type { Uint128Type } from './Uint128Schema.js'
import * as Effect from 'effect/Effect'

/**
 * Error thrown when Uint128 operations fail.
 * @since 0.0.1
 */
export class Uint128Error {
  /** Discriminant tag for error identification */
  readonly _tag = 'Uint128Error'
  constructor(readonly message: string) {}
}

export const from = (value: number | bigint | string): Effect.Effect<Uint128Type, Uint128Error> =>
  Effect.try({
    try: () => BrandedUint128.from(value),
    catch: (e) => new Uint128Error((e as Error).message)
  })

export const plus = (a: Uint128Type, b: Uint128Type): Effect.Effect<Uint128Type, Uint128Error> =>
  Effect.try({
    try: () => BrandedUint128.plus(a, b),
    catch: (e) => new Uint128Error((e as Error).message)
  })

export const minus = (a: Uint128Type, b: Uint128Type): Effect.Effect<Uint128Type, Uint128Error> =>
  Effect.try({
    try: () => BrandedUint128.minus(a, b),
    catch: (e) => new Uint128Error((e as Error).message)
  })

export const times = (a: Uint128Type, b: Uint128Type): Effect.Effect<Uint128Type, Uint128Error> =>
  Effect.try({
    try: () => BrandedUint128.times(a, b),
    catch: (e) => new Uint128Error((e as Error).message)
  })

export const toBigInt = (value: Uint128Type): bigint => BrandedUint128.toBigInt(value)
export const toNumber = (value: Uint128Type): number => BrandedUint128.toNumber(value)
export const toHex = (value: Uint128Type): string => BrandedUint128.toHex(value)
export const equals = (a: Uint128Type, b: Uint128Type): boolean => BrandedUint128.equals(a, b)

export const MAX = BrandedUint128.MAX
export const MIN = BrandedUint128.MIN
export const ZERO = BrandedUint128.ZERO
export const ONE = BrandedUint128.ONE
