/**
 * @fileoverview Free function to get a transaction by block hash and index.
 *
 * @module Provider/functions/getTransactionByBlockHashAndIndex
 * @since 0.4.0
 */

import * as Effect from "effect/Effect";
import type { TransportError } from "../../Transport/TransportError.js";
import { ProviderService } from "../ProviderService.js";
import {
	type HashInput,
	ProviderNotFoundError,
	type TransactionIndexInput,
	type TransactionType,
} from "../types.js";
import { toHashHex } from "../utils.js";

/**
 * Converts transaction index to hex string.
 */
const toIndexHex = (index: TransactionIndexInput): `0x${string}` => {
	if (typeof index === "string") return index;
	return `0x${BigInt(index).toString(16)}`;
};

/**
 * Gets a transaction by block hash and transaction index.
 *
 * @param blockHash - The block hash
 * @param index - The transaction index in the block
 * @returns Effect yielding the transaction
 *
 * @since 0.4.0
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { getTransactionByBlockHashAndIndex, Provider, HttpTransport } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   const tx = yield* getTransactionByBlockHashAndIndex('0x...blockHash', 0)
 *   console.log(`Transaction hash: ${tx.hash}`)
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY'))
 * )
 * ```
 */
export const getTransactionByBlockHashAndIndex = (
	blockHash: HashInput,
	index: TransactionIndexInput,
): Effect.Effect<TransactionType, TransportError | ProviderNotFoundError, ProviderService> =>
	Effect.flatMap(ProviderService, (svc) =>
		svc
			.request<TransactionType | null>("eth_getTransactionByBlockHashAndIndex", [
				toHashHex(blockHash),
				toIndexHex(index),
			])
			.pipe(
				Effect.flatMap((result) =>
					result === null
						? Effect.fail(
								new ProviderNotFoundError(
									{ blockHash, index },
									"Transaction not found",
									{ resource: "transaction" },
								),
							)
						: Effect.succeed(result),
				),
			),
	);
