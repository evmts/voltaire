/**
 * @fileoverview Effect-based module for Ethereum state proof management.
 * @module StateProof
 *
 * @description
 * This module provides Effect-based utilities for working with Ethereum state proofs.
 * State proofs are Merkle-Patricia proofs that cryptographically verify an account's
 * state against a state root, as defined in EIP-1186.
 *
 * Key features:
 * - Type-safe state proof creation with Effect error handling
 * - Schema-based validation using Effect Schema
 * - Equality comparison for state proofs
 *
 * State proofs are essential for:
 * - Light client verification
 * - Cross-chain communication
 * - Stateless Ethereum
 * - Proving account state without full node access
 *
 * A state proof contains:
 * - Account proof: Merkle proof from state root to account node
 * - Account data: balance, nonce, codeHash, storageHash
 * - Storage proofs: Merkle proofs for specific storage slots
 *
 * @example
 * ```typescript
 * import { StateProof } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * const program = Effect.gen(function* () {
 *   // Create from eth_getProof response
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
 *   console.log('Balance:', proof.balance)
 *   console.log('Nonce:', proof.nonce)
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
export { Schema, type StateProofType } from './StateProofSchema.js'
export { from } from './from.js'
export { equals } from './equals.js'
