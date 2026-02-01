/**
 * @fileoverview Free function to get the current block number.
 *
 * @module Provider/functions/getBlockNumber
 * @since 0.4.0
 */

import * as Effect from "effect/Effect";
import { ProviderService } from "../ProviderService.js";
import { ProviderResponseError } from "../types.js";
import type { TransportError } from "../../Transport/TransportError.js";

/**
 * Gets the current block number from the connected Ethereum node.
 *
 * @returns Effect yielding the current block number as bigint
 *
 * @since 0.4.0
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { getBlockNumber, Provider, HttpTransport } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   const blockNumber = yield* getBlockNumber()
 *   console.log('Current block:', blockNumber)
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY'))
 * )
 * ```
 */
export const getBlockNumber = (): Effect.Effect<
	bigint,
	TransportError | ProviderResponseError,
	ProviderService
> =>
	Effect.flatMap(ProviderService, (svc) =>
		svc.request<string>("eth_blockNumber").pipe(
			Effect.flatMap((hex) =>
				Effect.try({
					try: () => BigInt(hex),
					catch: (error) =>
						new ProviderResponseError(hex, "Invalid hex from eth_blockNumber", {
							cause: error,
						}),
				}),
			),
		),
	);
