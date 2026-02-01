/**
 * @fileoverview Free function to get the uncle count in a block.
 *
 * @module Provider/functions/getUncleCount
 * @since 0.4.0
 */

import { Hex } from "@tevm/voltaire";
import * as Effect from "effect/Effect";
import { ProviderService } from "../ProviderService.js";
import {
	type BlockTag,
	type GetUncleCountArgs,
	ProviderResponseError,
} from "../types.js";
import type { TransportError } from "../../Transport/TransportError.js";

/**
 * Gets the number of uncles in a block.
 *
 * @param args - Block identifier (blockTag or blockHash)
 * @returns Effect yielding the uncle count as bigint
 *
 * @since 0.4.0
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { getUncleCount, Provider, HttpTransport } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   // Get uncle count for latest block
 *   const count = yield* getUncleCount({})
 *
 *   // Get by block hash
 *   const countByHash = yield* getUncleCount({
 *     blockHash: '0x...'
 *   })
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY'))
 * )
 * ```
 */
export const getUncleCount = (
	args: GetUncleCountArgs = {},
): Effect.Effect<bigint, TransportError | ProviderResponseError, ProviderService> =>
	Effect.flatMap(ProviderService, (svc) => {
		if ("blockHash" in args && args.blockHash !== undefined) {
			const hash =
				typeof args.blockHash === "string"
					? args.blockHash
					: Hex(args.blockHash);
			return svc
				.request<string>("eth_getUncleCountByBlockHash", [hash])
				.pipe(
					Effect.flatMap((hex) =>
						Effect.try({
							try: () => BigInt(hex),
							catch: (error) =>
								new ProviderResponseError(
									hex,
									"Invalid hex from eth_getUncleCountByBlockHash",
									{ cause: error },
								),
						}),
					),
				);
		}

		const blockTag: BlockTag = args.blockTag ?? "latest";
		return svc
			.request<string>("eth_getUncleCountByBlockNumber", [blockTag])
			.pipe(
				Effect.flatMap((hex) =>
					Effect.try({
						try: () => BigInt(hex),
						catch: (error) =>
							new ProviderResponseError(
								hex,
								"Invalid hex from eth_getUncleCountByBlockNumber",
								{ cause: error },
							),
					}),
				),
			);
	});
