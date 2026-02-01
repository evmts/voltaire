/**
 * @fileoverview BeaconBlockRoot module for Ethereum beacon chain block roots.
 *
 * @description
 * EIP-4788 exposes beacon chain block roots in the EVM, enabling smart contracts
 * to access consensus layer state. The beacon block root is a 32-byte hash that
 * represents the state of the beacon chain at a specific slot.
 *
 * This module provides Effect-based schemas and functions for creating and
 * working with beacon block roots.
 *
 * ## Type Declarations
 *
 * ```typescript
 * import * as BeaconBlockRoot from 'voltaire-effect/primitives/BeaconBlockRoot'
 *
 * function verifyRoot(root: BeaconBlockRoot.BeaconBlockRootType) {
 *   // ...
 * }
 * ```
 *
 * @example
 * ```typescript
 * import * as BeaconBlockRoot from 'voltaire-effect/primitives/BeaconBlockRoot'
 * import * as Effect from 'effect/Effect'
 *
 * // Create from hex string
 * const root = await Effect.runPromise(BeaconBlockRoot.from('0x...'))
 *
 * // Convert back to hex
 * const hex = BeaconBlockRoot.toHex(root)
 * ```
 *
 * @see https://eips.ethereum.org/EIPS/eip-4788
 * @module BeaconBlockRoot
 * @since 0.0.1
 */

/** Schema for beacon block root validation */
export {
	BeaconBlockRootSchema,
	BeaconBlockRootSchema as Schema,
} from "./Hex.js";

/** Create beacon block root from hex string or bytes */

/** Convert beacon block root to hex string */
