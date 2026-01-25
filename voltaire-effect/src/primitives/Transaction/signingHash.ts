/**
 * @fileoverview Computes transaction signing hashes for signature creation.
 *
 * @module Transaction/signingHash
 * @since 0.0.1
 */
import * as Effect from 'effect/Effect'
import * as VoltaireTransaction from '@tevm/voltaire/Transaction'
import type { HashType } from '@tevm/voltaire/Hash'
import { InvalidTransactionTypeError } from '@tevm/voltaire/errors'
import type { Any } from './index.js'

/**
 * Computes the signing hash (digest) for a transaction.
 *
 * @description Calculates the Keccak-256 hash that must be signed by the
 * private key to create a valid transaction signature. The hash format
 * varies by transaction type:
 * - Legacy: RLP([nonce, gasPrice, gasLimit, to, value, data, chainId, 0, 0])
 * - EIP-2930+: keccak256(type || RLP(txData))
 *
 * @param {Any} tx - Transaction object to compute signing hash for (can be
 *   unsigned or signed - signature fields are excluded from hash computation)
 * @returns {Effect.Effect<HashType, InvalidTransactionTypeError>} Effect
 *   containing the 32-byte signing hash on success, or InvalidTransactionTypeError
 *   if the transaction type is invalid
 *
 * @example
 * ```typescript
 * import * as Transaction from 'voltaire-effect/primitives/Transaction'
 * import * as Effect from 'effect/Effect'
 * import { signHash } from './crypto.js'
 *
 * // Compute signing hash for an unsigned transaction
 * const hash = await Effect.runPromise(Transaction.signingHash({
 *   type: 2,
 *   chainId: 1n,
 *   nonce: 0n,
 *   maxPriorityFeePerGas: 1000000000n,
 *   maxFeePerGas: 30000000000n,
 *   gasLimit: 21000n,
 *   to: recipient,
 *   value: 1000000000000000000n,
 *   data: new Uint8Array(),
 *   accessList: [],
 * }))
 *
 * // Sign the hash with a private key
 * const signature = signHash(hash, privateKey)
 * ```
 *
 * @throws {InvalidTransactionTypeError} When the transaction type is not
 *   recognized or required fields are missing
 *
 * @see {@link serialize} - Serialize the signed transaction
 * @see {@link parse} - Parse a signed transaction
 *
 * @since 0.0.1
 */
export const signingHash = (tx: Any): Effect.Effect<HashType, InvalidTransactionTypeError> =>
  Effect.try({
    try: () => VoltaireTransaction.getSigningHash(tx),
    catch: (e) => e as InvalidTransactionTypeError,
  })
