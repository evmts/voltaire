/**
 * @fileoverview Effect-based operations for Int128 (signed 128-bit integer) type.
 * Provides type-safe arithmetic operations with overflow/underflow checking.
 * @module Int128/from
 * @since 0.0.1
 */

import { BrandedInt128 } from '@tevm/voltaire'
import type { Int128Type } from './Int128Schema.js'
import * as Effect from 'effect/Effect'

export { BrandedInt128 }

export class Int128Error {
  readonly _tag = 'Int128Error'
  constructor(readonly message: string) {}
}

export const from = (value: number | bigint | string): Effect.Effect<Int128Type, Int128Error> =>
  Effect.try({
    try: () => BrandedInt128.from(value),
    catch: (e) => new Int128Error((e as Error).message)
  })

export const fromHex = (hex: string): Effect.Effect<Int128Type, Int128Error> =>
  Effect.try({
    try: () => BrandedInt128.fromHex(hex),
    catch: (e) => new Int128Error((e as Error).message)
  })

export const fromBytes = (bytes: Uint8Array): Effect.Effect<Int128Type, Int128Error> =>
  Effect.try({
    try: () => BrandedInt128.fromBytes(bytes),
    catch: (e) => new Int128Error((e as Error).message)
  })

export const plus = (a: Int128Type, b: Int128Type): Effect.Effect<Int128Type, Int128Error> =>
  Effect.try({
    try: () => BrandedInt128.plus(a, b),
    catch: (e) => new Int128Error((e as Error).message)
  })

export const add = plus

export const minus = (a: Int128Type, b: Int128Type): Effect.Effect<Int128Type, Int128Error> =>
  Effect.try({
    try: () => BrandedInt128.minus(a, b),
    catch: (e) => new Int128Error((e as Error).message)
  })

export const sub = minus

export const times = (a: Int128Type, b: Int128Type): Effect.Effect<Int128Type, Int128Error> =>
  Effect.try({
    try: () => BrandedInt128.times(a, b),
    catch: (e) => new Int128Error((e as Error).message)
  })

export const mul = times

export const div = (a: Int128Type, b: Int128Type): Effect.Effect<Int128Type, Int128Error> =>
  Effect.try({
    try: () => BrandedInt128.dividedBy(a, b),
    catch: (e) => new Int128Error((e as Error).message)
  })

export const neg = (value: Int128Type): Effect.Effect<Int128Type, Int128Error> =>
  Effect.try({
    try: () => BrandedInt128.negate(value),
    catch: (e) => new Int128Error((e as Error).message)
  })

export const abs = (value: Int128Type): Effect.Effect<Int128Type, Int128Error> =>
  Effect.try({
    try: () => BrandedInt128.abs(value),
    catch: (e) => new Int128Error((e as Error).message)
  })

export const toNumber = (value: Int128Type): number => BrandedInt128.toNumber(value)

export const toBigInt = (value: Int128Type): bigint => BrandedInt128.toBigInt(value)

export const toHex = (value: Int128Type): string => BrandedInt128.toHex(value)

export const toBytes = (value: Int128Type): Uint8Array => BrandedInt128.toBytes(value)

export const equals = (a: Int128Type, b: Int128Type): boolean => BrandedInt128.equals(a, b)

export const compare = (a: Int128Type, b: Int128Type): -1 | 0 | 1 => {
  if (a < b) return -1
  if (a > b) return 1
  return 0
}

export const isNegative = (value: Int128Type): boolean => BrandedInt128.isNegative(value)

export const isZero = (value: Int128Type): boolean => BrandedInt128.isZero(value)

export const MAX = BrandedInt128.MAX

export const MIN = BrandedInt128.MIN

export const ZERO = BrandedInt128.ZERO

export const ONE = BrandedInt128.ONE

export const NEG_ONE = BrandedInt128.NEG_ONE
