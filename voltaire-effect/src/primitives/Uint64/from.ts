import { Uint64 } from '@tevm/voltaire'
import type { Uint64Type } from './Uint64Schema.js'
import * as Effect from 'effect/Effect'

/**
 * Error thrown when Uint64 operations fail.
 * @since 0.0.1
 */
export class Uint64Error {
  /** Discriminant tag for error identification */
  readonly _tag = 'Uint64Error'
  constructor(readonly message: string) {}
}

export const from = (value: number | bigint | string): Effect.Effect<Uint64Type, Uint64Error> =>
  Effect.try({
    try: () => Uint64.from(value),
    catch: (e) => new Uint64Error((e as Error).message)
  })

export const plus = (a: Uint64Type, b: Uint64Type): Effect.Effect<Uint64Type, Uint64Error> =>
  Effect.try({
    try: () => Uint64.plus(a, b),
    catch: (e) => new Uint64Error((e as Error).message)
  })

export const minus = (a: Uint64Type, b: Uint64Type): Effect.Effect<Uint64Type, Uint64Error> =>
  Effect.try({
    try: () => Uint64.minus(a, b),
    catch: (e) => new Uint64Error((e as Error).message)
  })

export const times = (a: Uint64Type, b: Uint64Type): Effect.Effect<Uint64Type, Uint64Error> =>
  Effect.try({
    try: () => Uint64.times(a, b),
    catch: (e) => new Uint64Error((e as Error).message)
  })

export const toBigInt = (value: Uint64Type): bigint => Uint64.toBigInt(value)
export const toNumber = (value: Uint64Type): number => Uint64.toNumber(value)
export const toHex = (value: Uint64Type): string => Uint64.toHex(value)
export const equals = (a: Uint64Type, b: Uint64Type): boolean => Uint64.equals(a, b)

export const MAX = Uint64.MAX
export const MIN = Uint64.MIN
export const ZERO = Uint64.ZERO
export const ONE = Uint64.ONE
