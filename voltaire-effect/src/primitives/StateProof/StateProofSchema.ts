/**
 * @fileoverview Effect Schema definitions for Ethereum state proofs.
 * Provides validation schemas for Merkle-Patricia state proofs.
 * @module StateProof/StateProofSchema
 * @since 0.0.1
 */

import { StateProof } from '@tevm/voltaire'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Represents a complete Merkle-Patricia proof for an account's state.
 *
 * @description
 * A StateProof contains all the data needed to cryptographically verify
 * an account's state against a state root. It includes:
 * - address: The account address being proven
 * - accountProof: Merkle proof nodes from state root to account
 * - balance: The account's ETH balance
 * - codeHash: Hash of the account's bytecode
 * - nonce: The account's nonce
 * - storageHash: Root of the account's storage trie
 * - storageProof: Array of storage slot proofs
 *
 * This corresponds to the result of eth_getProof RPC call.
 *
 * @example
 * ```typescript
 * import { StateProof } from 'voltaire-effect/primitives'
 *
 * // StateProof from eth_getProof
 * const proof: StateProofType = {
 *   address: '0x...',
 *   accountProof: ['0x...', '0x...'],
 *   balance: 1000000000000000000n,
 *   codeHash: '0x...',
 *   nonce: 5n,
 *   storageHash: '0x...',
 *   storageProof: [...]
 * }
 * ```
 *
 * @see {@link https://eips.ethereum.org/EIPS/eip-1186} EIP-1186 eth_getProof
 *
 * @since 0.0.1
 */
type StateProofType = StateProof.StateProofType

const StateProofTypeSchema = S.declare<StateProofType>(
  (u): u is StateProofType => {
    if (typeof u !== 'object' || u === null) return false
    const obj = u as StateProofType
    return (
      'address' in obj &&
      'accountProof' in obj &&
      'balance' in obj &&
      'codeHash' in obj &&
      'nonce' in obj &&
      'storageHash' in obj &&
      'storageProof' in obj &&
      Array.isArray(obj.accountProof) &&
      Array.isArray(obj.storageProof)
    )
  },
  { identifier: 'StateProof' }
)

/**
 * Effect Schema for validating state proof structure.
 *
 * @description
 * This schema validates that a state proof has all required fields
 * and correct structure. It performs pass-through validation, ensuring
 * the input already conforms to StateProofType.
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { Schema } from 'voltaire-effect/primitives/StateProof'
 *
 * const validate = S.is(Schema)
 * const isValid = validate({
 *   address: '0x...',
 *   accountProof: [],
 *   balance: 0n,
 *   codeHash: '0x...',
 *   nonce: 0n,
 *   storageHash: '0x...',
 *   storageProof: []
 * })
 * console.log(isValid) // true
 * ```
 *
 * @throws {ParseError} When the input doesn't match the expected structure
 *
 * @see {@link StateProofType} for the validated type
 * @see {@link from} for Effect-based creation
 *
 * @since 0.0.1
 */
export const Schema: S.Schema<StateProofType, StateProofType> = S.transformOrFail(
  StateProofTypeSchema,
  StateProofTypeSchema,
  {
    strict: true,
    decode: (t, _options, _ast) => ParseResult.succeed(t),
    encode: (t) => ParseResult.succeed(t)
  }
).annotations({ identifier: 'StateProofSchema' })

export type { StateProofType }
