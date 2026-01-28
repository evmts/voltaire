/**
 * @fileoverview Free function to get a block by tag, number, or hash.
 *
 * @module Provider/functions/getBlock
 * @since 0.4.0
 */

import * as Effect from "effect/Effect";
import { ProviderService } from "../ProviderService.js";
import {
	type BlockTag,
	type BlockType,
	type GetBlockArgs,
	ProviderNotFoundError,
} from "../types.js";
import type { TransportError } from "../../Transport/TransportError.js";

/**
 * Gets a block by tag, number, or hash.
 *
 * @param args - Block identifier (blockTag, blockNumber, or blockHash) and includeTransactions flag
 * @returns Effect yielding the block
 *
 * @since 0.4.0
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { getBlock, Provider, HttpTransport } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   // Get latest block
 *   const latest = yield* getBlock({})
 *
 *   // Get by block number
 *   const block = yield* getBlock({ blockNumber: 18000000n })
 *
 *   // Get by hash with full transactions
 *   const withTxs = yield* getBlock({
 *     blockHash: '0x...',
 *     includeTransactions: true
 *   })
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY'))
 * )
 * ```
 */
export const getBlock = (
	args: GetBlockArgs = {},
): Effect.Effect<BlockType, TransportError | ProviderNotFoundError, ProviderService> =>
	Effect.flatMap(ProviderService, (svc) => {
		const includeTransactions = args.includeTransactions ?? false;

		if ("blockHash" in args && args.blockHash !== undefined) {
			const hash =
				typeof args.blockHash === "string"
					? args.blockHash
					: `0x${Buffer.from(args.blockHash).toString("hex")}`;
			return svc
				.request<BlockType | null>("eth_getBlockByHash", [hash, includeTransactions])
				.pipe(
					Effect.flatMap((result) =>
						result === null
							? Effect.fail(
									new ProviderNotFoundError(args, "Block not found", {
										resource: "block",
									}),
								)
							: Effect.succeed(result),
					),
				);
		}

		let blockId: BlockTag;
		if ("blockNumber" in args && args.blockNumber !== undefined) {
			blockId = `0x${args.blockNumber.toString(16)}` as BlockTag;
		} else {
			blockId = args.blockTag ?? "latest";
		}

		return svc
			.request<BlockType | null>("eth_getBlockByNumber", [blockId, includeTransactions])
			.pipe(
				Effect.flatMap((result) =>
					result === null
						? Effect.fail(
								new ProviderNotFoundError(args, "Block not found", {
									resource: "block",
								}),
							)
						: Effect.succeed(result),
				),
			);
	});
