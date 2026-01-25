/**
 * @fileoverview BundleHash module for ERC-4337 account abstraction.
 *
 * @description
 * A BundleHash is a 32-byte identifier for a Bundle of UserOperations.
 *
 * ## Type Declarations
 *
 * ```typescript
 * import * as BundleHash from 'voltaire-effect/primitives/BundleHash'
 *
 * function trackBundle(hash: BundleHash.BundleHashType) {
 *   // ...
 * }
 * ```
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
export { BundleHashSchema, type BundleHashType } from "./Hex.js";
