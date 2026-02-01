/**
 * @fileoverview Free function to get the coinbase address.
 *
 * @module Provider/functions/getCoinbase
 * @since 0.4.0
 */

import * as Effect from "effect/Effect";
import { ProviderService } from "../ProviderService.js";
import type { TransportError } from "../../Transport/TransportError.js";

/**
 * Gets the coinbase address of the node.
 *
 * @returns Effect yielding the coinbase address
 *
 * @since 0.4.0
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { getCoinbase, Provider, HttpTransport } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   const coinbase = yield* getCoinbase()
 *   console.log('Coinbase:', coinbase)
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('http://localhost:8545'))
 * )
 * ```
 */
export const getCoinbase = (): Effect.Effect<
	`0x${string}`,
	TransportError,
	ProviderService
> =>
	Effect.flatMap(ProviderService, (svc) =>
		svc.request<`0x${string}`>("eth_coinbase"),
	);
