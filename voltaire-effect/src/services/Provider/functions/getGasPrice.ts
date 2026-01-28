/**
 * @fileoverview Free function to get the current gas price.
 *
 * @module Provider/functions/getGasPrice
 * @since 0.4.0
 */

import * as Effect from "effect/Effect";
import { ProviderService } from "../ProviderService.js";
import { parseHexToBigInt } from "../utils.js";
import type { TransportError } from "../../Transport/TransportError.js";
import type { ProviderResponseError } from "../types.js";

/**
 * Gets the current gas price in wei.
 *
 * @returns Effect yielding the gas price as bigint
 *
 * @since 0.4.0
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { getGasPrice, Provider, HttpTransport } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   const gasPrice = yield* getGasPrice()
 *   console.log('Gas price:', gasPrice, 'wei')
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY'))
 * )
 * ```
 */
export const getGasPrice = (): Effect.Effect<
	bigint,
	TransportError | ProviderResponseError,
	ProviderService
> =>
	Effect.flatMap(ProviderService, (svc) =>
		svc.request<string>("eth_gasPrice").pipe(
			Effect.flatMap((response) =>
				parseHexToBigInt({ method: "eth_gasPrice", response }),
			),
		),
	);
