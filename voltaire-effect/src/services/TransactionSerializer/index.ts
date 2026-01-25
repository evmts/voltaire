/**
 * @fileoverview Transaction serializer module exports.
 *
 * @module TransactionSerializer
 * @since 0.1.0
 *
 * @description
 * This module provides transaction serialization/deserialization services
 * for Ethereum transactions.
 *
 * Main exports:
 * - {@link TransactionSerializerService} - The service tag/interface
 * - {@link DefaultTransactionSerializer} - Default implementation layer
 * - {@link SerializeError} - Error type for serialization failures
 * - {@link DeserializeError} - Error type for deserialization failures
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import {
 *   TransactionSerializerService,
 *   DefaultTransactionSerializer
 * } from 'voltaire-effect/services'
 *
 * const program = Effect.gen(function* () {
 *   const serializer = yield* TransactionSerializerService
 *   const bytes = yield* serializer.serialize(tx)
 *   return bytes
 * }).pipe(Effect.provide(DefaultTransactionSerializer.Live))
 * ```
 */

export { DefaultTransactionSerializer } from "./DefaultTransactionSerializer.js";
export {
	DeserializeError,
	SerializeError,
	TransactionSerializerService,
} from "./TransactionSerializerService.js";
