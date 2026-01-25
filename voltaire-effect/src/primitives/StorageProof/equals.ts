/**
 * @fileoverview Equality comparison for EVM storage proofs.
 * @module StorageProof/equals
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
 * Compares two StorageProofs for equality.
 *
 * @description
 * Performs a deep equality check comparing all fields of two storage proofs:
 * key, value, and the proof array. This is useful for verifying that two
 * proofs represent the same storage slot state.
 *
 * @param {StorageProofType} a - First storage proof
 * @param {StorageProofType} b - Second storage proof
 * @returns {Effect.Effect<boolean, never>} Effect containing true if proofs are equal
 *
 * @example
 * ```typescript
 * import { StorageProof } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * const program = Effect.gen(function* () {
 *   const proof1 = yield* StorageProof.from({
 *     key: '0x0',
 *     value: 100n,
 *     proof: ['0x...']
 *   })
 *
 *   const proof2 = yield* StorageProof.from({
 *     key: '0x0',
 *     value: 100n,
 *     proof: ['0x...']
 *   })
 *
 *   const areEqual = yield* StorageProof.equals(proof1, proof2)
 *   console.log('Proofs equal:', areEqual) // true
 * })
 * ```
 *
 * @example
 * ```typescript
 * // Compare proofs from different sources
 * const program = Effect.gen(function* () {
 *   const localProof = yield* generateLocalProof(slot)
 *   const remoteProof = yield* fetchRemoteProof(slot)
 *
 *   const match = yield* StorageProof.equals(localProof, remoteProof)
 *   if (!match) {
 *     console.log('Proofs differ - possible state divergence')
 *   }
 * })
 * ```
 *
 * @see {@link from} for creating storage proofs
 *
 * @since 0.0.1
 */
export const equals = (a: StorageProofType, b: StorageProofType): Effect.Effect<boolean, never> =>
  Effect.succeed(StorageProof.equals(a, b))
