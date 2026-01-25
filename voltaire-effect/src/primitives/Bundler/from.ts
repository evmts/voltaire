/**
 * @fileoverview Bundler functions for ERC-4337 account abstraction.
 * 
 * This module provides Effect-based functions for creating and working with
 * Bundler addresses.
 * 
 * @see https://eips.ethereum.org/EIPS/eip-4337#bundlers
 * @module Bundler/from
 * @since 0.0.1
 */
import { Address } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'
import type { BundlerType } from './BundlerSchema.js'

/**
 * Error thrown when Bundler operations fail.
 * 
 * @since 0.0.1
 */
export class BundlerError extends Error {
  /** Error discriminator tag for pattern matching */
  readonly _tag = 'BundlerError'
  constructor(message: string) {
    super(message)
    this.name = 'BundlerError'
  }
}

/**
 * Creates a Bundler from address string or bytes.
 * 
 * @param value - Address as hex string or 20-byte Uint8Array
 * @returns Effect yielding BundlerType or failing with BundlerError
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Bundler from 'voltaire-effect/primitives/Bundler'
 * 
 * const bundler = Effect.runSync(
 *   Bundler.from('0x1234567890123456789012345678901234567890')
 * )
 * ```
 * 
 * @throws BundlerError - When address is invalid or not 20 bytes
 * @since 0.0.1
 */
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

/**
 * Converts a Bundler to hex string.
 * 
 * @param bundler - The bundler address
 * @returns Effect yielding checksummed hex string
 * 
 * @since 0.0.1
 */
export const toHex = (bundler: BundlerType): Effect.Effect<string, never> =>
  Effect.succeed(Address.toHex(bundler as any))

/**
 * Compares two Bundlers for equality.
 * 
 * @param a - First bundler
 * @param b - Second bundler
 * @returns Effect yielding true if addresses are identical
 * 
 * @since 0.0.1
 */
export const equals = (a: BundlerType, b: BundlerType): Effect.Effect<boolean, never> => {
  if (a.length !== b.length) return Effect.succeed(false)
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return Effect.succeed(false)
  }
  return Effect.succeed(true)
}

/**
 * Checks if a Bundler has a zero address.
 * 
 * @param bundler - The bundler to check
 * @returns Effect yielding true if address is all zeros
 * 
 * @since 0.0.1
 */
export const isZero = (bundler: BundlerType): Effect.Effect<boolean, never> => {
  for (let i = 0; i < bundler.length; i++) {
    if (bundler[i] !== 0) return Effect.succeed(false)
  }
  return Effect.succeed(true)
}
