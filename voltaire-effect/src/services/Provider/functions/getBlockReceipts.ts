/**
 * @fileoverview Free function to get all transaction receipts for a block.
 *
 * @module Provider/functions/getBlockReceipts
 * @since 0.4.0
 */

import * as Effect from "effect/Effect";
import { ProviderService } from "../ProviderService.js";
import {
	type BlockTag,
	type GetBlockReceiptsArgs,
	type ReceiptType,
	ProviderNotFoundError,
} from "../types.js";
import type { TransportError } from "../../Transport/TransportError.js";

/**
 * Gets all transaction receipts for a block.
 *
 * @param args - Block identifier (blockTag, blockNumber, or blockHash)
 * @returns Effect yielding an array of transaction receipts
 *
 * @since 0.4.0
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { getBlockReceipts, Provider, HttpTransport } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   // Get receipts for latest block
 *   const receipts = yield* getBlockReceipts({})
 *
 *   // Get by block number
 *   const receiptsByNumber = yield* getBlockReceipts({
 *     blockNumber: 18000000n
 *   })
 *
 *   // Get by block hash
 *   const receiptsByHash = yield* getBlockReceipts({
 *     blockHash: '0x...'
 *   })
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY'))
 * )
 * ```
 */
export const getBlockReceipts = (
	args: GetBlockReceiptsArgs = {},
): Effect.Effect<ReceiptType[], TransportError | ProviderNotFoundError, ProviderService> =>
	Effect.flatMap(ProviderService, (svc) => {
		let blockId: string;

		if ("blockHash" in args && args.blockHash !== undefined) {
			blockId =
				typeof args.blockHash === "string"
					? args.blockHash
					: `0x${Buffer.from(args.blockHash).toString("hex")}`;
		} else if ("blockNumber" in args && args.blockNumber !== undefined) {
			blockId = `0x${args.blockNumber.toString(16)}`;
		} else {
			blockId = args.blockTag ?? "latest";
		}

		return svc.request<ReceiptType[] | null>("eth_getBlockReceipts", [blockId]).pipe(
			Effect.flatMap((result) =>
				result === null
					? Effect.fail(
							new ProviderNotFoundError(args, "Block receipts not found", {
								resource: "blockReceipts",
							}),
						)
					: Effect.succeed(result),
			),
		);
	});
