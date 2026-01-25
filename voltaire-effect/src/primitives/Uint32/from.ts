import { BrandedUint32 } from '@tevm/voltaire'
import type { Uint32Type } from './Uint32Schema.js'
import * as Effect from 'effect/Effect'

/**
 * Error thrown when Uint32 operations fail.
 * @since 0.0.1
 */
export class Uint32Error {
  /** Discriminant tag for error identification */
  readonly _tag = 'Uint32Error'
  constructor(readonly message: string) {}
}

export const from = (value: number | bigint | string): Effect.Effect<Uint32Type, Uint32Error> =>
  Effect.try({
    try: () => BrandedUint32.from(value),
    catch: (e) => new Uint32Error((e as Error).message)
  })

export const plus = (a: Uint32Type, b: Uint32Type): Effect.Effect<Uint32Type, Uint32Error> =>
  Effect.try({
    try: () => BrandedUint32.plus(a, b),
    catch: (e) => new Uint32Error((e as Error).message)
  })

export const minus = (a: Uint32Type, b: Uint32Type): Effect.Effect<Uint32Type, Uint32Error> =>
  Effect.try({
    try: () => BrandedUint32.minus(a, b),
    catch: (e) => new Uint32Error((e as Error).message)
  })

export const times = (a: Uint32Type, b: Uint32Type): Effect.Effect<Uint32Type, Uint32Error> =>
  Effect.try({
    try: () => BrandedUint32.times(a, b),
    catch: (e) => new Uint32Error((e as Error).message)
  })

export const toNumber = (value: Uint32Type): number => BrandedUint32.toNumber(value)
export const toHex = (value: Uint32Type): string => BrandedUint32.toHex(value)
export const equals = (a: Uint32Type, b: Uint32Type): boolean => BrandedUint32.equals(a, b)

export const MAX = BrandedUint32.MAX
export const MIN = BrandedUint32.MIN
export const ZERO = BrandedUint32.ZERO
export const ONE = BrandedUint32.ONE
