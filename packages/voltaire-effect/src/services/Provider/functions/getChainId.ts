/**
 * @fileoverview Free function to get the chain ID.
 *
 * @module Provider/functions/getChainId
 * @since 0.4.0
 */

import * as Effect from "effect/Effect";
import { ProviderService } from "../ProviderService.js";
import { parseHexToBigInt } from "../utils.js";
import type { TransportError } from "../../Transport/TransportError.js";
import type { ProviderResponseError } from "../types.js";

/**
 * Gets the chain ID of the connected Ethereum network.
 *
 * @returns Effect yielding the chain ID as bigint
 *
 * @since 0.4.0
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { getChainId, Provider, HttpTransport } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   const chainId = yield* getChainId()
 *   console.log('Chain ID:', chainId)
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY'))
 * )
 * ```
 */
export const getChainId = (): Effect.Effect<
	bigint,
	TransportError | ProviderResponseError,
	ProviderService
> =>
	Effect.flatMap(ProviderService, (svc) =>
		svc.request<string>("eth_chainId").pipe(
			Effect.flatMap((response) =>
				parseHexToBigInt({ method: "eth_chainId", response }),
			),
		),
	);
