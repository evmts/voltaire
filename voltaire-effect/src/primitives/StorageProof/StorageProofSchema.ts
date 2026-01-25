/**
 * @fileoverview Effect Schema definitions for EVM storage proofs.
 * Provides validation schemas for Merkle-Patricia storage proofs.
 * @module StorageProof/StorageProofSchema
 * @since 0.0.1
 */

import { StorageProof } from '@tevm/voltaire'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Represents a Merkle-Patricia proof for a specific storage slot.
 *
 * @description
 * A StorageProof contains the cryptographic proof needed to verify a storage
 * slot's value against the account's storage root. It includes:
 * - key: The storage slot key being proven
 * - value: The value stored at that slot
 * - proof: Array of RLP-encoded Merkle proof nodes
 *
 * Storage proofs are part of the eth_getProof response (EIP-1186) and enable
 * trustless verification of contract storage without full node access.
 *
 * @example
 * ```typescript
 * import { StorageProof } from 'voltaire-effect/primitives'
 *
 * // Storage proof from eth_getProof
 * const proof: StorageProofType = {
 *   key: '0x0000000000000000000000000000000000000000000000000000000000000000',
 *   value: 100n,
 *   proof: ['0x...', '0x...']
 * }
 * ```
 *
 * @see {@link https://eips.ethereum.org/EIPS/eip-1186} EIP-1186 eth_getProof
 *
 * @since 0.0.1
 */
type StorageProofType = StorageProof.StorageProofType

const StorageProofTypeSchema = S.declare<StorageProofType>(
  (u): u is StorageProofType => {
    if (typeof u !== 'object' || u === null) return false
    const obj = u as StorageProofType
    return (
      'key' in obj &&
      'value' in obj &&
      'proof' in obj &&
      Array.isArray(obj.proof)
    )
  },
  { identifier: 'StorageProof' }
)

/**
 * Effect Schema for validating storage proof structure.
 *
 * @description
 * This schema validates that a storage proof has all required fields
 * and correct structure. It performs pass-through validation, ensuring
 * the input already conforms to StorageProofType.
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { Schema } from 'voltaire-effect/primitives/StorageProof'
 *
 * const validate = S.is(Schema)
 * const isValid = validate({
 *   key: '0x0',
 *   value: 0n,
 *   proof: []
 * })
 * console.log(isValid) // true
 * ```
 *
 * @throws {ParseError} When the input doesn't match the expected structure
 *
 * @see {@link StorageProofType} for the validated type
 * @see {@link from} for Effect-based creation
 *
 * @since 0.0.1
 */
export const Schema: S.Schema<StorageProofType, StorageProofType> = S.transformOrFail(
  StorageProofTypeSchema,
  StorageProofTypeSchema,
  {
    strict: true,
    decode: (t, _options, _ast) => ParseResult.succeed(t),
    encode: (t) => ParseResult.succeed(t)
  }
).annotations({ identifier: 'StorageProofSchema' })

export type { StorageProofType }
