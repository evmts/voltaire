/**
 * @fileoverview Effect-based operations for Int16 (signed 16-bit integer) type.
 * Provides type-safe arithmetic operations with overflow/underflow checking.
 * @module Int16/from
 * @since 0.0.1
 */

import { BrandedInt16 } from '@tevm/voltaire'
import type { Int16Type } from './Int16Schema.js'
import * as Effect from 'effect/Effect'

export { BrandedInt16 }

export class Int16Error {
  readonly _tag = 'Int16Error'
  constructor(readonly message: string) {}
}

export const from = (value: number | bigint | string): Effect.Effect<Int16Type, Int16Error> =>
  Effect.try({
    try: () => BrandedInt16.from(value),
    catch: (e) => new Int16Error((e as Error).message)
  })

export const fromHex = (hex: string): Effect.Effect<Int16Type, Int16Error> =>
  Effect.try({
    try: () => BrandedInt16.fromHex(hex),
    catch: (e) => new Int16Error((e as Error).message)
  })

export const fromBytes = (bytes: Uint8Array): Effect.Effect<Int16Type, Int16Error> =>
  Effect.try({
    try: () => BrandedInt16.fromBytes(bytes),
    catch: (e) => new Int16Error((e as Error).message)
  })

export const plus = (a: Int16Type, b: Int16Type): Effect.Effect<Int16Type, Int16Error> =>
  Effect.try({
    try: () => BrandedInt16.plus(a, b),
    catch: (e) => new Int16Error((e as Error).message)
  })

export const add = plus

export const minus = (a: Int16Type, b: Int16Type): Effect.Effect<Int16Type, Int16Error> =>
  Effect.try({
    try: () => BrandedInt16.minus(a, b),
    catch: (e) => new Int16Error((e as Error).message)
  })

export const sub = minus

export const times = (a: Int16Type, b: Int16Type): Effect.Effect<Int16Type, Int16Error> =>
  Effect.try({
    try: () => BrandedInt16.times(a, b),
    catch: (e) => new Int16Error((e as Error).message)
  })

export const mul = times

export const div = (a: Int16Type, b: Int16Type): Effect.Effect<Int16Type, Int16Error> =>
  Effect.try({
    try: () => BrandedInt16.dividedBy(a, b),
    catch: (e) => new Int16Error((e as Error).message)
  })

export const neg = (value: Int16Type): Effect.Effect<Int16Type, Int16Error> =>
  Effect.try({
    try: () => BrandedInt16.negate(value),
    catch: (e) => new Int16Error((e as Error).message)
  })

export const abs = (value: Int16Type): Effect.Effect<Int16Type, Int16Error> =>
  Effect.try({
    try: () => BrandedInt16.abs(value),
    catch: (e) => new Int16Error((e as Error).message)
  })

export const toNumber = (value: Int16Type): number => BrandedInt16.toNumber(value)

export const toHex = (value: Int16Type): string => BrandedInt16.toHex(value)

export const toBytes = (value: Int16Type): Uint8Array => BrandedInt16.toBytes(value)

export const equals = (a: Int16Type, b: Int16Type): boolean => BrandedInt16.equals(a, b)

export const compare = (a: Int16Type, b: Int16Type): -1 | 0 | 1 => {
  if (a < b) return -1
  if (a > b) return 1
  return 0
}

export const isNegative = (value: Int16Type): boolean => BrandedInt16.isNegative(value)

export const isZero = (value: Int16Type): boolean => BrandedInt16.isZero(value)

export const INT16_MIN = BrandedInt16.INT16_MIN

export const INT16_MAX = BrandedInt16.INT16_MAX
