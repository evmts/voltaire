/**
 * @fileoverview Free function to get a transaction by hash.
 *
 * @module Provider/functions/getTransaction
 * @since 0.4.0
 */

import * as Effect from "effect/Effect";
import type { TransportError } from "../../Transport/TransportError.js";
import { ProviderService } from "../ProviderService.js";
import {
	type HashInput,
	ProviderNotFoundError,
	type TransactionType,
} from "../types.js";
import { toHashHex } from "../utils.js";

/**
 * Gets a transaction by its hash.
 *
 * @param hash - The transaction hash
 * @returns Effect yielding the transaction
 *
 * @since 0.4.0
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { getTransaction, Provider, HttpTransport } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   const tx = yield* getTransaction('0x...')
 *   console.log(`From: ${tx.from}`)
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY'))
 * )
 * ```
 */
export const getTransaction = (
	hash: HashInput,
): Effect.Effect<TransactionType, TransportError | ProviderNotFoundError, ProviderService> =>
	Effect.flatMap(ProviderService, (svc) =>
		svc
			.request<TransactionType | null>("eth_getTransactionByHash", [toHashHex(hash)])
			.pipe(
				Effect.flatMap((result) =>
					result === null
						? Effect.fail(
								new ProviderNotFoundError(hash, "Transaction not found", {
									resource: "transaction",
								}),
							)
						: Effect.succeed(result),
				),
			),
	);
