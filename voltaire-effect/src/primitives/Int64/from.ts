/**
 * @fileoverview Effect-based operations for Int64 (signed 64-bit integer) type.
 * Provides type-safe arithmetic operations with overflow/underflow checking.
 * @module Int64/from
 * @since 0.0.1
 */

import { BrandedInt64 } from '@tevm/voltaire'
import type { Int64Type } from './Int64Schema.js'
import * as Effect from 'effect/Effect'

export { BrandedInt64 }

export class Int64Error {
  readonly _tag = 'Int64Error'
  constructor(readonly message: string) {}
}

export const from = (value: number | bigint | string): Effect.Effect<Int64Type, Int64Error> =>
  Effect.try({
    try: () => BrandedInt64.from(value),
    catch: (e) => new Int64Error((e as Error).message)
  })

export const fromHex = (hex: string): Effect.Effect<Int64Type, Int64Error> =>
  Effect.try({
    try: () => BrandedInt64.fromHex(hex),
    catch: (e) => new Int64Error((e as Error).message)
  })

export const fromBytes = (bytes: Uint8Array): Effect.Effect<Int64Type, Int64Error> =>
  Effect.try({
    try: () => BrandedInt64.fromBytes(bytes),
    catch: (e) => new Int64Error((e as Error).message)
  })

export const plus = (a: Int64Type, b: Int64Type): Effect.Effect<Int64Type, Int64Error> =>
  Effect.try({
    try: () => BrandedInt64.plus(a, b),
    catch: (e) => new Int64Error((e as Error).message)
  })

export const add = plus

export const minus = (a: Int64Type, b: Int64Type): Effect.Effect<Int64Type, Int64Error> =>
  Effect.try({
    try: () => BrandedInt64.minus(a, b),
    catch: (e) => new Int64Error((e as Error).message)
  })

export const sub = minus

export const times = (a: Int64Type, b: Int64Type): Effect.Effect<Int64Type, Int64Error> =>
  Effect.try({
    try: () => BrandedInt64.times(a, b),
    catch: (e) => new Int64Error((e as Error).message)
  })

export const mul = times

export const div = (a: Int64Type, b: Int64Type): Effect.Effect<Int64Type, Int64Error> =>
  Effect.try({
    try: () => BrandedInt64.dividedBy(a, b),
    catch: (e) => new Int64Error((e as Error).message)
  })

export const neg = (value: Int64Type): Effect.Effect<Int64Type, Int64Error> =>
  Effect.try({
    try: () => BrandedInt64.negate(value),
    catch: (e) => new Int64Error((e as Error).message)
  })

export const abs = (value: Int64Type): Effect.Effect<Int64Type, Int64Error> =>
  Effect.try({
    try: () => BrandedInt64.abs(value),
    catch: (e) => new Int64Error((e as Error).message)
  })

export const toNumber = (value: Int64Type): number => BrandedInt64.toNumber(value)

export const toBigInt = (value: Int64Type): bigint => BrandedInt64.toBigInt(value)

export const toHex = (value: Int64Type): string => BrandedInt64.toHex(value)

export const toBytes = (value: Int64Type): Uint8Array => BrandedInt64.toBytes(value)

export const equals = (a: Int64Type, b: Int64Type): boolean => BrandedInt64.equals(a, b)

export const compare = (a: Int64Type, b: Int64Type): -1 | 0 | 1 => {
  if (a < b) return -1
  if (a > b) return 1
  return 0
}

export const isNegative = (value: Int64Type): boolean => BrandedInt64.isNegative(value)

export const isZero = (value: Int64Type): boolean => BrandedInt64.isZero(value)

export const INT64_MIN = BrandedInt64.INT64_MIN

export const INT64_MAX = BrandedInt64.INT64_MAX
