/**
 * @fileoverview Default implementation of TransactionSerializerService.
 *
 * @module DefaultTransactionSerializer
 * @since 0.1.0
 *
 * @description
 * Provides the default implementation of TransactionSerializerService using
 * @tevm/voltaire/Transaction primitives.
 *
 * @see {@link TransactionSerializerService} - The service interface
 */

import * as VoltaireTransaction from "@tevm/voltaire/Transaction";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

import {
	DeserializeError,
	SerializeError,
	TransactionSerializerService,
} from "./TransactionSerializerService.js";

/**
 * Live implementation of TransactionSerializerService.
 *
 * @description
 * Uses VoltaireTransaction.serialize(), VoltaireTransaction.deserialize(),
 * and VoltaireTransaction.getSigningHash() for transaction operations.
 *
 * @since 0.1.0
 */
const TransactionSerializerLive: Layer.Layer<TransactionSerializerService> =
	Layer.succeed(TransactionSerializerService, {
		serialize: (tx) =>
			Effect.try({
				try: () => VoltaireTransaction.serialize(tx as VoltaireTransaction.Any),
				catch: (error) =>
					new SerializeError({
						transaction: tx,
						message: `Failed to serialize transaction: ${error instanceof Error ? error.message : String(error)}`,
						cause: error,
					}),
			}),

		deserialize: (bytes) =>
			Effect.try({
				try: () => VoltaireTransaction.deserialize(bytes),
				catch: (error) =>
					new DeserializeError({
						bytes,
						message: `Failed to deserialize transaction: ${error instanceof Error ? error.message : String(error)}`,
						cause: error,
					}),
			}),

		getSigningPayload: (tx) =>
			Effect.try({
				try: () =>
					VoltaireTransaction.getSigningHash(
						tx as VoltaireTransaction.Any,
					) as Uint8Array,
				catch: (error) =>
					new SerializeError({
						transaction: tx,
						message: `Failed to get signing payload: ${error instanceof Error ? error.message : String(error)}`,
						cause: error,
					}),
			}),
	});

/**
 * Default transaction serializer namespace with layer.
 *
 * @since 0.1.0
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { TransactionSerializerService, DefaultTransactionSerializer } from 'voltaire-effect/services'
 *
 * const program = Effect.gen(function* () {
 *   const serializer = yield* TransactionSerializerService
 *
 *   // Serialize a transaction
 *   const tx = {
 *     type: 2,
 *     chainId: 1n,
 *     nonce: 0n,
 *     maxFeePerGas: 20000000000n,
 *     maxPriorityFeePerGas: 1000000000n,
 *     gasLimit: 21000n,
 *     to: '0x...',
 *     value: 1000000000000000000n,
 *     data: new Uint8Array(0),
 *     accessList: []
 *   }
 *
 *   const bytes = yield* serializer.serialize(tx)
 *   const signingPayload = yield* serializer.getSigningPayload(tx)
 *   const decoded = yield* serializer.deserialize(bytes)
 * }).pipe(Effect.provide(DefaultTransactionSerializer.Live))
 * ```
 */
export const DefaultTransactionSerializer = {
	/**
	 * Live layer providing TransactionSerializerService.
	 */
	Live: TransactionSerializerLive,
} as const;
