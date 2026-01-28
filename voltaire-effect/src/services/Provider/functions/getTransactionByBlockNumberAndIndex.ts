/**
 * @fileoverview Free function to get a transaction by block number and index.
 *
 * @module Provider/functions/getTransactionByBlockNumberAndIndex
 * @since 0.4.0
 */

import * as Effect from "effect/Effect";
import type { TransportError } from "../../Transport/TransportError.js";
import { ProviderService } from "../ProviderService.js";
import {
	type BlockTag,
	ProviderNotFoundError,
	type TransactionIndexInput,
	type TransactionType,
} from "../types.js";

/**
 * Converts transaction index to hex string.
 */
const toIndexHex = (index: TransactionIndexInput): `0x${string}` => {
	if (typeof index === "string") return index;
	return `0x${BigInt(index).toString(16)}`;
};

/**
 * Converts block tag or bigint to RPC block identifier.
 */
const toBlockId = (blockTag: BlockTag | bigint): BlockTag => {
	if (typeof blockTag === "bigint") {
		return `0x${blockTag.toString(16)}` as BlockTag;
	}
	return blockTag;
};

/**
 * Gets a transaction by block number/tag and transaction index.
 *
 * @param blockTag - The block number or tag
 * @param index - The transaction index in the block
 * @returns Effect yielding the transaction
 *
 * @since 0.4.0
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { getTransactionByBlockNumberAndIndex, Provider, HttpTransport } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   // Get first transaction in block 18000000
 *   const tx = yield* getTransactionByBlockNumberAndIndex(18000000n, 0)
 *   console.log(`Transaction hash: ${tx.hash}`)
 *
 *   // Get from latest block
 *   const latestTx = yield* getTransactionByBlockNumberAndIndex('latest', 0)
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY'))
 * )
 * ```
 */
export const getTransactionByBlockNumberAndIndex = (
	blockTag: BlockTag | bigint,
	index: TransactionIndexInput,
): Effect.Effect<TransactionType, TransportError | ProviderNotFoundError, ProviderService> =>
	Effect.flatMap(ProviderService, (svc) =>
		svc
			.request<TransactionType | null>("eth_getTransactionByBlockNumberAndIndex", [
				toBlockId(blockTag),
				toIndexHex(index),
			])
			.pipe(
				Effect.flatMap((result) =>
					result === null
						? Effect.fail(
								new ProviderNotFoundError(
									{ blockTag, index },
									"Transaction not found",
									{ resource: "transaction" },
								),
							)
						: Effect.succeed(result),
				),
			),
	);
