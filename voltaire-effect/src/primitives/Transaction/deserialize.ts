/**
 * @fileoverview Deserializes RLP-encoded Ethereum transactions with Effect error handling.
 *
 * @module Transaction/deserialize
 * @since 0.0.1
 */
import * as Effect from 'effect/Effect'
import * as VoltaireTransaction from '@tevm/voltaire/Transaction'
import { InvalidTransactionTypeError } from '@tevm/voltaire/errors'
import type { Any } from './index.js'

/**
 * Deserializes RLP-encoded transaction bytes into a typed Transaction object.
 *
 * @param data - RLP-encoded transaction bytes
 * @returns Effect containing the deserialized Transaction, or InvalidTransactionTypeError on failure
 *
 * @example
 * ```typescript
 * import * as Transaction from 'voltaire-effect/primitives/Transaction'
 * import * as Effect from 'effect/Effect'
 *
 * const tx = await Effect.runPromise(Transaction.deserialize(rawBytes))
 * ```
 *
 * @since 0.0.1
 */
export const deserialize = (data: Uint8Array): Effect.Effect<Any, InvalidTransactionTypeError> =>
  Effect.try({
    try: () => VoltaireTransaction.deserialize(data) as Any,
    catch: (e) => e as InvalidTransactionTypeError,
  })
