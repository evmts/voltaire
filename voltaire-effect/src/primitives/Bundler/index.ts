/**
 * @fileoverview Bundler module for ERC-4337 account abstraction.
 * 
 * Bundlers are off-chain actors in ERC-4337 that collect UserOperations from
 * the mempool and submit them to the EntryPoint contract. They are compensated
 * for gas costs through the UserOperation fees.
 * 
 * This module provides Effect-based schemas and functions for working with
 * Bundler addresses.
 * 
 * @example
 * ```typescript
 * import * as Bundler from 'voltaire-effect/primitives/Bundler'
 * import * as Effect from 'effect/Effect'
 * 
 * const bundler = Effect.runSync(
 *   Bundler.from('0x1234567890123456789012345678901234567890')
 * )
 * ```
 * 
 * @see https://eips.ethereum.org/EIPS/eip-4337#bundlers
 * @module Bundler
 * @since 0.0.1
 */
export { BundlerSchema, type BundlerType } from './BundlerSchema.js'
export { from, toHex, equals, isZero, BundlerError } from './from.js'
