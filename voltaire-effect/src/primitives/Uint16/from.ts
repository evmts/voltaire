import { BrandedUint16 } from '@tevm/voltaire'
import type { Uint16Type } from './Uint16Schema.js'
import * as Effect from 'effect/Effect'

/**
 * Error thrown when Uint16 operations fail.
 * @since 0.0.1
 */
export class Uint16Error {
  /** Discriminant tag for error identification */
  readonly _tag = 'Uint16Error'
  constructor(readonly message: string) {}
}

export const from = (value: number | string): Effect.Effect<Uint16Type, Uint16Error> =>
  Effect.try({
    try: () => BrandedUint16.from(value),
    catch: (e) => new Uint16Error((e as Error).message)
  })

export const plus = (a: Uint16Type, b: Uint16Type): Effect.Effect<Uint16Type, Uint16Error> =>
  Effect.try({
    try: () => BrandedUint16.plus(a, b),
    catch: (e) => new Uint16Error((e as Error).message)
  })

export const minus = (a: Uint16Type, b: Uint16Type): Effect.Effect<Uint16Type, Uint16Error> =>
  Effect.try({
    try: () => BrandedUint16.minus(a, b),
    catch: (e) => new Uint16Error((e as Error).message)
  })

export const times = (a: Uint16Type, b: Uint16Type): Effect.Effect<Uint16Type, Uint16Error> =>
  Effect.try({
    try: () => BrandedUint16.times(a, b),
    catch: (e) => new Uint16Error((e as Error).message)
  })

export const toNumber = (value: Uint16Type): number => BrandedUint16.toNumber(value)
export const toHex = (value: Uint16Type): string => BrandedUint16.toHex(value)
export const equals = (a: Uint16Type, b: Uint16Type): boolean => BrandedUint16.equals(a, b)

export const MAX = BrandedUint16.MAX
export const MIN = BrandedUint16.MIN
export const ZERO = BrandedUint16.ZERO
export const ONE = BrandedUint16.ONE
