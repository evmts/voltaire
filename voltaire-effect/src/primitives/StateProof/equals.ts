/**
 * @fileoverview Equality comparison for Ethereum state proofs.
 * @module StateProof/equals
 * @since 0.0.1
 */

import { StateProof } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'

/**
 * Represents a complete Merkle-Patricia proof for an account's state.
 * @see StateProofSchema for full documentation
 */
type StateProofType = StateProof.StateProofType

/**
 * Compares two StateProofs for equality.
 *
 * @description
 * Performs a deep equality check comparing all fields of two state proofs:
 * address, accountProof, balance, codeHash, nonce, storageHash, and storageProof.
 *
 * This is useful for verifying that two proofs represent the same state,
 * such as when comparing proofs from different sources.
 *
 * @param {StateProofType} a - First state proof
 * @param {StateProofType} b - Second state proof
 * @returns {Effect.Effect<boolean, never>} Effect containing true if proofs are equal
 *
 * @example
 * ```typescript
 * import { StateProof } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * const program = Effect.gen(function* () {
 *   const proof1 = yield* StateProof.from({
 *     address: '0x...',
 *     accountProof: ['0x...'],
 *     balance: 100n,
 *     codeHash: '0x...',
 *     nonce: 0n,
 *     storageHash: '0x...',
 *     storageProof: []
 *   })
 *
 *   const proof2 = yield* StateProof.from({
 *     address: '0x...',
 *     accountProof: ['0x...'],
 *     balance: 100n,
 *     codeHash: '0x...',
 *     nonce: 0n,
 *     storageHash: '0x...',
 *     storageProof: []
 *   })
 *
 *   const areEqual = yield* StateProof.equals(proof1, proof2)
 *   console.log('Proofs equal:', areEqual) // true
 * })
 * ```
 *
 * @see {@link from} for creating state proofs
 *
 * @since 0.0.1
 */
export const equals = (a: StateProofType, b: StateProofType): Effect.Effect<boolean, never> =>
  Effect.succeed(StateProof.equals(a, b))
