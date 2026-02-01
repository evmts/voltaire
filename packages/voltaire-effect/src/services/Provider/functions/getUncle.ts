/**
 * @fileoverview Free function to get an uncle block by index.
 *
 * @module Provider/functions/getUncle
 * @since 0.4.0
 */

import * as Effect from "effect/Effect";
import { ProviderService } from "../ProviderService.js";
import {
	type BlockTag,
	type GetUncleArgs,
	type UncleBlockType,
	ProviderNotFoundError,
} from "../types.js";
import type { TransportError } from "../../Transport/TransportError.js";

/**
 * Gets an uncle block by block identifier and uncle index.
 *
 * @param args - Block identifier (blockTag or blockHash)
 * @param uncleIndex - The index of the uncle in the block
 * @returns Effect yielding the uncle block
 *
 * @since 0.4.0
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { getUncle, Provider, HttpTransport } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   // Get first uncle of a block by number
 *   const uncle = yield* getUncle({ blockTag: '0x1234' }, 0)
 *
 *   // Get by block hash
 *   const uncleByHash = yield* getUncle({
 *     blockHash: '0x...'
 *   }, 0)
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY'))
 * )
 * ```
 */
export const getUncle = (
	args: GetUncleArgs = {},
	uncleIndex: number | bigint,
): Effect.Effect<UncleBlockType, TransportError | ProviderNotFoundError, ProviderService> =>
	Effect.flatMap(ProviderService, (svc) => {
		const indexHex = `0x${BigInt(uncleIndex).toString(16)}`;

		if ("blockHash" in args && args.blockHash !== undefined) {
			const hash =
				typeof args.blockHash === "string"
					? args.blockHash
					: `0x${Buffer.from(args.blockHash).toString("hex")}`;
			return svc
				.request<UncleBlockType | null>("eth_getUncleByBlockHashAndIndex", [
					hash,
					indexHex,
				])
				.pipe(
					Effect.flatMap((result) =>
						result === null
							? Effect.fail(
									new ProviderNotFoundError(
										{ ...args, uncleIndex },
										"Uncle not found",
										{ resource: "uncle" },
									),
								)
							: Effect.succeed(result),
					),
				);
		}

		const blockTag: BlockTag = args.blockTag ?? "latest";
		return svc
			.request<UncleBlockType | null>("eth_getUncleByBlockNumberAndIndex", [
				blockTag,
				indexHex,
			])
			.pipe(
				Effect.flatMap((result) =>
					result === null
						? Effect.fail(
								new ProviderNotFoundError(
									{ ...args, uncleIndex },
									"Uncle not found",
									{ resource: "uncle" },
								),
							)
						: Effect.succeed(result),
				),
			);
	});
