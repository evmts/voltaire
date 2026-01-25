/**
 * @fileoverview Parses RLP-encoded Ethereum transactions with Effect error handling.
 *
 * @module Transaction/parse
 * @since 0.0.1
 */
import * as Effect from 'effect/Effect'
import * as VoltaireTransaction from '@tevm/voltaire/Transaction'
import { InvalidTransactionTypeError } from '@tevm/voltaire/errors'
import type { Any } from './index.js'

/**
 * Parses a raw RLP-encoded transaction into a typed Transaction object.
 *
 * @description Automatically detects the transaction type from the encoded
 * bytes and deserializes it into the appropriate typed structure. For typed
 * transactions (EIP-2718+), the first byte indicates the transaction type.
 * Legacy transactions are detected by RLP structure.
 *
 * @param {Uint8Array} data - RLP-encoded transaction bytes
 * @returns {Effect.Effect<Any, InvalidTransactionTypeError>} Effect containing
 *   the parsed Transaction on success, or InvalidTransactionTypeError if the
 *   transaction format is invalid or unrecognized
 *
 * @example
 * ```typescript
 * import * as Transaction from 'voltaire-effect/primitives/Transaction'
 * import * as Effect from 'effect/Effect'
 *
 * // Parse a raw transaction
 * const program = Transaction.parse(rawBytes)
 * const tx = await Effect.runPromise(program)
 *
 * // Access transaction fields based on type
 * console.log(`Type: ${tx.type}`)
 * console.log(`Nonce: ${tx.nonce}`)
 *
 * // Handle parsing errors
 * const result = await Effect.runPromise(
 *   Effect.either(Transaction.parse(invalidBytes))
 * )
 * if (result._tag === 'Left') {
 *   console.error('Parse failed:', result.left.message)
 * }
 * ```
 *
 * @throws {InvalidTransactionTypeError} When the transaction type byte is
 *   unrecognized or the RLP structure is malformed
 *
 * @see {@link serialize} - Serialize a transaction back to bytes
 * @see {@link signingHash} - Compute the signing hash for a transaction
 *
 * @since 0.0.1
 */
export const parse = (data: Uint8Array): Effect.Effect<Any, InvalidTransactionTypeError> =>
  Effect.try({
    try: () => VoltaireTransaction.deserialize(data) as Any,
    catch: (e) => e as InvalidTransactionTypeError,
  })
