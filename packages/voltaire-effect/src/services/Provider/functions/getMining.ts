/**
 * @fileoverview Free function to check mining status.
 *
 * @module Provider/functions/getMining
 * @since 0.4.0
 */

import * as Effect from "effect/Effect";
import { ProviderService } from "../ProviderService.js";
import type { TransportError } from "../../Transport/TransportError.js";

/**
 * Checks if the node is currently mining.
 *
 * @returns Effect yielding true if mining, false otherwise
 *
 * @since 0.4.0
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { getMining, Provider, HttpTransport } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   const isMining = yield* getMining()
 *   console.log('Mining:', isMining)
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('http://localhost:8545'))
 * )
 * ```
 */
export const getMining = (): Effect.Effect<
	boolean,
	TransportError,
	ProviderService
> =>
	Effect.flatMap(ProviderService, (svc) =>
		svc.request<boolean>("eth_mining"),
	);
