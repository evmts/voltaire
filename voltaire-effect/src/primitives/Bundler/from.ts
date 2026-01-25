import { Address } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'
import type { BundlerType } from './BundlerSchema.js'

export class BundlerError extends Error {
  readonly _tag = 'BundlerError'
  constructor(message: string) {
    super(message)
    this.name = 'BundlerError'
  }
}

export const from = (value: string | Uint8Array): Effect.Effect<BundlerType, BundlerError> =>
  Effect.try({
    try: () => {
      if (typeof value === 'string') {
        return Address(value) as unknown as BundlerType
      }
      if (value.length !== 20) {
        throw new Error('Bundler address must be exactly 20 bytes')
      }
      return value as unknown as BundlerType
    },
    catch: (e) => new BundlerError((e as Error).message)
  })

export const toHex = (bundler: BundlerType): Effect.Effect<string, never> =>
  Effect.succeed(Address.toHex(bundler as any))

export const equals = (a: BundlerType, b: BundlerType): Effect.Effect<boolean, never> => {
  if (a.length !== b.length) return Effect.succeed(false)
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return Effect.succeed(false)
  }
  return Effect.succeed(true)
}

export const isZero = (bundler: BundlerType): Effect.Effect<boolean, never> => {
  for (let i = 0; i < bundler.length; i++) {
    if (bundler[i] !== 0) return Effect.succeed(false)
  }
  return Effect.succeed(true)
}
