/**
 * @fileoverview Effect-based operations for Int32 (signed 32-bit integer) type.
 * Provides type-safe arithmetic operations with overflow/underflow checking.
 * @module Int32/from
 * @since 0.0.1
 */

import { BrandedInt32 } from '@tevm/voltaire'
import type { Int32Type } from './Int32Schema.js'
import * as Effect from 'effect/Effect'

export { BrandedInt32 }

export class Int32Error {
  readonly _tag = 'Int32Error'
  constructor(readonly message: string) {}
}

export const from = (value: number | bigint | string): Effect.Effect<Int32Type, Int32Error> =>
  Effect.try({
    try: () => BrandedInt32.from(value),
    catch: (e) => new Int32Error((e as Error).message)
  })

export const fromHex = (hex: string): Effect.Effect<Int32Type, Int32Error> =>
  Effect.try({
    try: () => BrandedInt32.fromHex(hex),
    catch: (e) => new Int32Error((e as Error).message)
  })

export const fromBytes = (bytes: Uint8Array): Effect.Effect<Int32Type, Int32Error> =>
  Effect.try({
    try: () => BrandedInt32.fromBytes(bytes),
    catch: (e) => new Int32Error((e as Error).message)
  })

export const plus = (a: Int32Type, b: Int32Type): Effect.Effect<Int32Type, Int32Error> =>
  Effect.try({
    try: () => BrandedInt32.plus(a, b),
    catch: (e) => new Int32Error((e as Error).message)
  })

export const add = plus

export const minus = (a: Int32Type, b: Int32Type): Effect.Effect<Int32Type, Int32Error> =>
  Effect.try({
    try: () => BrandedInt32.minus(a, b),
    catch: (e) => new Int32Error((e as Error).message)
  })

export const sub = minus

export const times = (a: Int32Type, b: Int32Type): Effect.Effect<Int32Type, Int32Error> =>
  Effect.try({
    try: () => BrandedInt32.times(a, b),
    catch: (e) => new Int32Error((e as Error).message)
  })

export const mul = times

export const div = (a: Int32Type, b: Int32Type): Effect.Effect<Int32Type, Int32Error> =>
  Effect.try({
    try: () => BrandedInt32.dividedBy(a, b),
    catch: (e) => new Int32Error((e as Error).message)
  })

export const neg = (value: Int32Type): Effect.Effect<Int32Type, Int32Error> =>
  Effect.try({
    try: () => BrandedInt32.negate(value),
    catch: (e) => new Int32Error((e as Error).message)
  })

export const abs = (value: Int32Type): Effect.Effect<Int32Type, Int32Error> =>
  Effect.try({
    try: () => BrandedInt32.abs(value),
    catch: (e) => new Int32Error((e as Error).message)
  })

export const toNumber = (value: Int32Type): number => BrandedInt32.toNumber(value)

export const toBigInt = (value: Int32Type): bigint => BrandedInt32.toBigInt(value)

export const toHex = (value: Int32Type): string => BrandedInt32.toHex(value)

export const toBytes = (value: Int32Type): Uint8Array => BrandedInt32.toBytes(value)

export const equals = (a: Int32Type, b: Int32Type): boolean => BrandedInt32.equals(a, b)

export const compare = (a: Int32Type, b: Int32Type): -1 | 0 | 1 => {
  if (a < b) return -1
  if (a > b) return 1
  return 0
}

export const isNegative = (value: Int32Type): boolean => BrandedInt32.isNegative(value)

export const isZero = (value: Int32Type): boolean => BrandedInt32.isZero(value)

export const INT32_MIN = BrandedInt32.INT32_MIN

export const INT32_MAX = BrandedInt32.INT32_MAX
