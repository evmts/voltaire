/**
 * @fileoverview Functions for creating EVM storage proofs.
 * Provides Effect-based constructors for StorageProof.
 * @module StorageProof/from
 * @since 0.0.1
 */

import { StorageProof } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'

/**
 * Represents a Merkle-Patricia proof for a specific storage slot.
 * @see StorageProofSchema for full documentation
 */
type StorageProofType = StorageProof.StorageProofType

/**
 * Union type for values that can be converted to a StorageProof.
 *
 * @description
 * Accepts various input formats that can be normalized into a StorageProofType,
 * including the response format from eth_getProof RPC calls.
 *
 * @since 0.0.1
 */
type StorageProofLike = StorageProof.StorageProofLike

/**
 * Creates a StorageProof from a StorageProofLike value.
 *
 * @description
 * Converts various input formats into a normalized StorageProofType.
 * This function wraps the creation in an Effect for type-safe error handling.
 *
 * Storage proofs are typically obtained from the eth_getProof RPC method
 * as part of the storageProof array in the response. They enable verification
 * of storage slot values against the account's storage root.
 *
 * @param {StorageProofLike} value - The storage proof data
 * @returns {Effect.Effect<StorageProofType, Error>} Effect containing the StorageProof or an error
 *
 * @example
 * ```typescript
 * import { StorageProof } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * const program = Effect.gen(function* () {
 *   // From eth_getProof response's storageProof array
 *   const proof = yield* StorageProof.from({
 *     key: '0x0000000000000000000000000000000000000000000000000000000000000000',
 *     value: 1000000000000000000n,
 *     proof: ['0x...', '0x...']
 *   })
 *
 *   console.log('Storage key:', proof.key)
 *   console.log('Storage value:', proof.value)
 *   console.log('Proof nodes:', proof.proof.length)
 *
 *   return proof
 * })
 *
 * Effect.runPromise(program)
 * ```
 *
 * @example
 * ```typescript
 * // Verify storage slot in a contract
 * const program = Effect.gen(function* () {
 *   // Get proof for ERC20 balance mapping
 *   // Slot = keccak256(address . mappingSlot)
 *   const proof = yield* StorageProof.from({
 *     key: computedSlot,
 *     value: balance,
 *     proof: proofNodes
 *   })
 *
 *   // Verify against storage root
 *   const isValid = verifyMerkleProof(storageRoot, proof)
 * })
 * ```
 *
 * @throws {Error} When the input cannot be converted to a valid storage proof
 *
 * @see {@link equals} for comparing two storage proofs
 * @see {@link https://eips.ethereum.org/EIPS/eip-1186} EIP-1186 eth_getProof
 *
 * @since 0.0.1
 */
export const from = (value: StorageProofLike): Effect.Effect<StorageProofType, Error> =>
  Effect.try({
    try: () => StorageProof.from(value),
    catch: (e) => e as Error
  })
