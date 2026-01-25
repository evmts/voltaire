/**
 * @fileoverview BundleHash module for ERC-4337 account abstraction.
 * 
 * A BundleHash is a 32-byte identifier for a Bundle of UserOperations.
 * 
 * @example
 * ```typescript
 * import * as BundleHash from 'voltaire-effect/primitives/BundleHash'
 * import * as Effect from 'effect/Effect'
 * 
 * const hash = Effect.runSync(BundleHash.from('0x...'))
 * const hex = Effect.runSync(BundleHash.toHex(hash))
 * ```
 * 
 * @see https://eips.ethereum.org/EIPS/eip-4337
 * @module BundleHash
 * @since 0.0.1
 */
export { BundleHashSchema, type BundleHashType } from './BundleHashSchema.js'
export { from, toHex, equals, isZero, BundleHashError, type BundleHashLike } from './from.js'
