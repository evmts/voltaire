/**
 * @fileoverview Effect-based module for EVM storage proof management.
 * @module StorageProof
 *
 * @description
 * This module provides Effect-based utilities for working with EVM storage proofs.
 * Storage proofs are Merkle-Patricia proofs that cryptographically verify a storage
 * slot's value against an account's storage root, as defined in EIP-1186.
 *
 * Key features:
 * - Type-safe storage proof creation with Effect error handling
 * - Schema-based validation using Effect Schema
 * - Equality comparison for storage proofs
 *
 * Storage proofs are essential for:
 * - Light client verification of contract state
 * - Cross-chain communication (e.g., proving token balances)
 * - Stateless Ethereum
 * - Trustless verification without full node access
 *
 * A storage proof contains:
 * - key: The storage slot being proven
 * - value: The value at that slot
 * - proof: Merkle proof nodes from storage root to the slot
 *
 * @example
 * ```typescript
 * import { StorageProof } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * const program = Effect.gen(function* () {
 *   // Create from eth_getProof response
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
 *   // Compare two proofs
 *   const otherProof = yield* StorageProof.from({...})
 *   const areEqual = yield* StorageProof.equals(proof, otherProof)
 *
 *   return proof
 * })
 * ```
 *
 * @see {@link https://eips.ethereum.org/EIPS/eip-1186} EIP-1186 eth_getProof specification
 * @see {@link https://ethereum.org/en/developers/docs/data-structures-and-encoding/patricia-merkle-trie/} Merkle Patricia Trie
 *
 * @since 0.0.1
 */
export { Schema, type StorageProofType } from './StorageProofSchema.js'
export { from } from './from.js'
export { equals } from './equals.js'
