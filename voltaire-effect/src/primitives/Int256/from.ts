/**
 * @fileoverview Effect-based operations for Int256 (signed 256-bit integer) type.
 * Provides type-safe creation and conversion for Solidity's int256 type.
 * @module Int256/from
 * @since 0.0.1
 */

import { BrandedInt256 } from '@tevm/voltaire'
import type { Int256Type } from './Int256Schema.js'
import * as Effect from 'effect/Effect'

export { BrandedInt256 }

export class Int256Error extends Error {
  readonly _tag = 'Int256Error'
  constructor(message: string, readonly cause?: unknown) {
    super(message)
    this.name = 'Int256Error'
  }
}

export function from(value: bigint | number | string): Effect.Effect<Int256Type, Int256Error> {
  return Effect.try({
    try: () => BrandedInt256.from(value),
    catch: (e) => new Int256Error((e as Error).message, e)
  })
}

export function fromHex(value: string): Effect.Effect<Int256Type, Int256Error> {
  return Effect.try({
    try: () => BrandedInt256.fromHex(value),
    catch: (e) => new Int256Error((e as Error).message, e)
  })
}

export function fromBigInt(value: bigint): Effect.Effect<Int256Type, Int256Error> {
  return Effect.try({
    try: () => BrandedInt256.fromBigInt(value),
    catch: (e) => new Int256Error((e as Error).message, e)
  })
}

export function fromBytes(bytes: Uint8Array): Effect.Effect<Int256Type, Int256Error> {
  return Effect.try({
    try: () => BrandedInt256.fromBytes(bytes),
    catch: (e) => new Int256Error((e as Error).message, e)
  })
}

export const plus = (a: Int256Type, b: Int256Type): Effect.Effect<Int256Type, Int256Error> =>
  Effect.try({
    try: () => BrandedInt256.plus(a, b),
    catch: (e) => new Int256Error((e as Error).message, e)
  })

export const add = plus

export const minus = (a: Int256Type, b: Int256Type): Effect.Effect<Int256Type, Int256Error> =>
  Effect.try({
    try: () => BrandedInt256.minus(a, b),
    catch: (e) => new Int256Error((e as Error).message, e)
  })

export const sub = minus

export const times = (a: Int256Type, b: Int256Type): Effect.Effect<Int256Type, Int256Error> =>
  Effect.try({
    try: () => BrandedInt256.times(a, b),
    catch: (e) => new Int256Error((e as Error).message, e)
  })

export const mul = times

export const div = (a: Int256Type, b: Int256Type): Effect.Effect<Int256Type, Int256Error> =>
  Effect.try({
    try: () => BrandedInt256.dividedBy(a, b),
    catch: (e) => new Int256Error((e as Error).message, e)
  })

export const neg = (value: Int256Type): Effect.Effect<Int256Type, Int256Error> =>
  Effect.try({
    try: () => BrandedInt256.negate(value),
    catch: (e) => new Int256Error((e as Error).message, e)
  })

export const abs = (value: Int256Type): Effect.Effect<Int256Type, Int256Error> =>
  Effect.try({
    try: () => BrandedInt256.abs(value),
    catch: (e) => new Int256Error((e as Error).message, e)
  })

export const toNumber = (value: Int256Type): number => BrandedInt256.toNumber(value)

export const toBigInt = (value: Int256Type): bigint => BrandedInt256.toBigInt(value)

export const toHex = (value: Int256Type): string => BrandedInt256.toHex(value)

export const toBytes = (value: Int256Type): Uint8Array => BrandedInt256.toBytes(value)

export const equals = (a: Int256Type, b: Int256Type): boolean => BrandedInt256.equals(a, b)

export const compare = (a: Int256Type, b: Int256Type): -1 | 0 | 1 => {
  if (a < b) return -1
  if (a > b) return 1
  return 0
}

export const isNegative = (value: Int256Type): boolean => BrandedInt256.isNegative(value)

export const isZero = (value: Int256Type): boolean => BrandedInt256.isZero(value)

export const MAX = BrandedInt256.MAX

export const MIN = BrandedInt256.MIN

export const ZERO = BrandedInt256.ZERO

export const ONE = BrandedInt256.ONE

export const NEG_ONE = BrandedInt256.NEG_ONE
