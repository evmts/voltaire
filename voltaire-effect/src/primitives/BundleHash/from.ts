import { Bytes32, type Bytes32Type } from '@tevm/voltaire/Bytes'
import * as Effect from 'effect/Effect'
import type { BundleHashType } from './BundleHashSchema.js'

export class BundleHashError extends Error {
  readonly _tag = 'BundleHashError'
  constructor(message: string) {
    super(message)
    this.name = 'BundleHashError'
  }
}

export type BundleHashLike = BundleHashType | string | Uint8Array | bigint | number

export const from = (value: BundleHashLike): Effect.Effect<BundleHashType, BundleHashError> =>
  Effect.try({
    try: () => Bytes32.Bytes32(value as string | Uint8Array | bigint | number) as BundleHashType,
    catch: (e) => new BundleHashError((e as Error).message)
  })

export const toHex = (hash: BundleHashType): Effect.Effect<string, never> =>
  Effect.succeed('0x' + Array.from(hash).map(b => b.toString(16).padStart(2, '0')).join(''))

export const equals = (a: BundleHashType, b: BundleHashType): Effect.Effect<boolean, never> => {
  if (a.length !== b.length) return Effect.succeed(false)
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return Effect.succeed(false)
  }
  return Effect.succeed(true)
}

export const isZero = (hash: BundleHashType): Effect.Effect<boolean, never> => {
  for (let i = 0; i < hash.length; i++) {
    if (hash[i] !== 0) return Effect.succeed(false)
  }
  return Effect.succeed(true)
}
