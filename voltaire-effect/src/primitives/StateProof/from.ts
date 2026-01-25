/**
 * @fileoverview Functions for creating Ethereum state proofs.
 * Provides Effect-based constructors for StateProof.
 * @module StateProof/from
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
 * Union type for values that can be converted to a StateProof.
 *
 * @description
 * Accepts various input formats that can be normalized into a StateProofType,
 * including the response format from eth_getProof RPC calls.
 *
 * @since 0.0.1
 */
type StateProofLike = StateProof.StateProofLike

/**
 * Creates a StateProof from a StateProofLike value.
 *
 * @description
 * Converts various input formats into a normalized StateProofType.
 * This function wraps the creation in an Effect for type-safe error handling.
 *
 * State proofs are typically obtained from the eth_getProof RPC method and
 * used to cryptographically verify account state against a state root.
 *
 * @param {StateProofLike} value - The state proof data
 * @returns {Effect.Effect<StateProofType, Error>} Effect containing the StateProof or an error
 *
 * @example
 * ```typescript
 * import { StateProof } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * const program = Effect.gen(function* () {
 *   // Typically from eth_getProof response
 *   const proof = yield* StateProof.from({
 *     address: '0x1234567890123456789012345678901234567890',
 *     accountProof: ['0x...', '0x...'],
 *     balance: 1000000000000000000n,
 *     codeHash: '0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470',
 *     nonce: 5n,
 *     storageHash: '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421',
 *     storageProof: []
 *   })
 *
 *   console.log('Account balance:', proof.balance)
 *   return proof
 * })
 *
 * Effect.runPromise(program)
 * ```
 *
 * @throws {Error} When the input cannot be converted to a valid state proof
 *
 * @see {@link equals} for comparing two state proofs
 * @see {@link https://eips.ethereum.org/EIPS/eip-1186} EIP-1186 eth_getProof
 *
 * @since 0.0.1
 */
export const from = (value: StateProofLike): Effect.Effect<StateProofType, Error> =>
  Effect.try({
    try: () => StateProof.from(value),
    catch: (e) => e as Error
  })
