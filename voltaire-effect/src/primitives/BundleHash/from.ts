/**
 * @fileoverview BundleHash functions for ERC-4337 account abstraction.
 * 
 * @see https://eips.ethereum.org/EIPS/eip-4337
 * @module BundleHash/from
 * @since 0.0.1
 */
import { Bytes32, type Bytes32Type } from '@tevm/voltaire/Bytes'
import * as Effect from 'effect/Effect'
import type { BundleHashType } from './BundleHashSchema.js'

/**
 * Error thrown when BundleHash operations fail.
 * @since 0.0.1
 */
export class BundleHashError extends Error {
  /** Error discriminator tag for pattern matching */
  readonly _tag = 'BundleHashError'
  constructor(message: string) {
    super(message)
    this.name = 'BundleHashError'
  }
}

/**
 * Input types that can be converted to a BundleHash.
 * @since 0.0.1
 */
export type BundleHashLike = BundleHashType | string | Uint8Array | bigint | number

/**
 * Creates a BundleHash from various input types.
 * 
 * @param value - Hash as hex string, bytes, bigint, or number
 * @returns Effect yielding BundleHashType or failing with BundleHashError
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as BundleHash from 'voltaire-effect/primitives/BundleHash'
 * 
 * const hash = Effect.runSync(BundleHash.from('0x...'))
 * ```
 * 
 * @since 0.0.1
 */
export const from = (value: BundleHashLike): Effect.Effect<BundleHashType, BundleHashError> =>
  Effect.try({
    try: () => Bytes32.Bytes32(value as string | Uint8Array | bigint | number) as BundleHashType,
    catch: (e) => new BundleHashError((e as Error).message)
  })

/**
 * Converts a BundleHash to hex string.
 * @param hash - The BundleHash
 * @returns Effect yielding 66-character hex string
 * @since 0.0.1
 */
export const toHex = (hash: BundleHashType): Effect.Effect<string, never> =>
  Effect.succeed('0x' + Array.from(hash).map(b => b.toString(16).padStart(2, '0')).join(''))

/**
 * Compares two BundleHashes for equality.
 * @param a - First hash
 * @param b - Second hash
 * @returns Effect yielding true if hashes are identical
 * @since 0.0.1
 */
export const equals = (a: BundleHashType, b: BundleHashType): Effect.Effect<boolean, never> => {
  if (a.length !== b.length) return Effect.succeed(false)
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return Effect.succeed(false)
  }
  return Effect.succeed(true)
}

/**
 * Checks if a BundleHash is all zeros.
 * @param hash - The BundleHash to check
 * @returns Effect yielding true if hash is all zeros
 * @since 0.0.1
 */
export const isZero = (hash: BundleHashType): Effect.Effect<boolean, never> => {
  for (let i = 0; i < hash.length; i++) {
    if (hash[i] !== 0) return Effect.succeed(false)
  }
  return Effect.succeed(true)
}
