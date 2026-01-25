/**
 * @fileoverview Serializes Ethereum transactions to RLP-encoded bytes.
 *
 * @module Transaction/serialize
 * @since 0.0.1
 */
import * as Effect from 'effect/Effect'
import * as VoltaireTransaction from '@tevm/voltaire/Transaction'
import { InvalidTransactionTypeError } from '@tevm/voltaire/errors'
import type { Any } from './index.js'

/**
 * Serializes a Transaction object to RLP-encoded bytes.
 *
 * @description Encodes the transaction in the appropriate format based on its
 * type. For typed transactions (EIP-2718+), prepends the type byte to the
 * RLP-encoded payload. Legacy transactions are encoded directly as RLP.
 *
 * @param {Any} tx - Transaction object to serialize
 * @returns {Effect.Effect<Uint8Array, InvalidTransactionTypeError>} Effect
 *   containing the RLP-encoded bytes on success, or InvalidTransactionTypeError
 *   if the transaction type is invalid
 *
 * @example
 * ```typescript
 * import * as Transaction from 'voltaire-effect/primitives/Transaction'
 * import * as Effect from 'effect/Effect'
 *
 * // Serialize an EIP-1559 transaction
 * const bytes = await Effect.runPromise(Transaction.serialize({
 *   type: 2,
 *   chainId: 1n,
 *   nonce: 0n,
 *   maxPriorityFeePerGas: 1000000000n,
 *   maxFeePerGas: 30000000000n,
 *   gasLimit: 21000n,
 *   to: address,
 *   value: 0n,
 *   data: new Uint8Array(),
 *   accessList: [],
 *   yParity: 0,
 *   r: new Uint8Array(32),
 *   s: new Uint8Array(32),
 * }))
 *
 * // Broadcast the serialized transaction
 * await rpcClient.sendRawTransaction(bytes)
 * ```
 *
 * @throws {InvalidTransactionTypeError} When the transaction type is not
 *   recognized or the transaction structure is invalid
 *
 * @see {@link parse} - Parse RLP-encoded bytes back to Transaction
 * @see {@link signingHash} - Compute the signing hash before serializing
 *
 * @since 0.0.1
 */
export const serialize = (tx: Any): Effect.Effect<Uint8Array, InvalidTransactionTypeError> =>
  Effect.try({
    try: () => VoltaireTransaction.serialize(tx),
    catch: (e) => e as InvalidTransactionTypeError,
  })
