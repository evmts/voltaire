/**
 * @fileoverview Effect-based module for Ethereum state root management.
 * @module StateRoot
 *
 * @description
 * This module provides Effect-based utilities for working with Ethereum state roots.
 * A state root is a 32-byte Keccak-256 hash that uniquely identifies the complete
 * state of all accounts on the Ethereum blockchain.
 *
 * Key features:
 * - Type-safe state root creation with Effect error handling
 * - Schema-based validation using Effect Schema
 * - Support for multiple input formats (hex, bytes, bigint)
 *
 * State roots are fundamental to Ethereum's security model:
 * - Every block header contains a state root
 * - State proofs verify account state against the state root
 * - Light clients use state roots for verification
 *
 * @example
 * ```typescript
 * import { StateRoot } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * const program = Effect.gen(function* () {
 *   // Create from hex string (e.g., from block header)
 *   const root = yield* StateRoot.from(
 *     '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421'
 *   )
 *
 *   // Create empty state root
 *   const empty = StateRoot.empty()
 *
 *   console.log('Root length:', root.length) // 32
 *   return root
 * })
 * ```
 *
 * @see {@link https://ethereum.org/en/developers/docs/data-structures-and-encoding/patricia-merkle-trie/} Merkle Patricia Trie
 * @see {@link https://ethereum.org/en/developers/docs/blocks/} Block Structure
 *
 * @since 0.0.1
 */
import type { Bytes32Type } from '@tevm/voltaire/Bytes'

export { StateRootSchema, type StateRootType } from './StateRootSchema.js'
export { from, empty } from './from.js'

/**
 * Union type for values that can be converted to a StateRoot.
 *
 * @description
 * Accepts various input formats that can be normalized into a StateRootType:
 * - Hex strings (with or without 0x prefix)
 * - Uint8Array (must be 32 bytes)
 * - bigint (will be padded to 32 bytes)
 * - number (will be padded to 32 bytes)
 * - Existing StateRootType values
 *
 * @since 0.0.1
 */
export type StateRootLike = StateRootType | string | Uint8Array | bigint | number

type StateRootType = Bytes32Type & { readonly __tag: 'StateRoot' }
