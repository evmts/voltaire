/**
 * @fileoverview Free function to get the hashrate.
 *
 * @module Provider/functions/getHashrate
 * @since 0.4.0
 */

import * as Effect from "effect/Effect";
import { ProviderService } from "../ProviderService.js";
import { parseHexToBigInt } from "../utils.js";
import type { TransportError } from "../../Transport/TransportError.js";
import type { ProviderResponseError } from "../types.js";

/**
 * Gets the current hashrate of the node.
 *
 * @returns Effect yielding the hashrate as bigint
 *
 * @since 0.4.0
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { getHashrate, Provider, HttpTransport } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   const hashrate = yield* getHashrate()
 *   console.log('Hashrate:', hashrate)
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('http://localhost:8545'))
 * )
 * ```
 */
export const getHashrate = (): Effect.Effect<
	bigint,
	TransportError | ProviderResponseError,
	ProviderService
> =>
	Effect.flatMap(ProviderService, (svc) =>
		svc.request<string>("eth_hashrate").pipe(
			Effect.flatMap((response) =>
				parseHexToBigInt({ method: "eth_hashrate", response }),
			),
		),
	);
