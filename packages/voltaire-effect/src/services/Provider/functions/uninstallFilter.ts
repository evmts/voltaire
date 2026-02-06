/**
 * @fileoverview Free function to uninstall a filter.
 *
 * @module Provider/functions/uninstallFilter
 * @since 0.4.0
 */

import * as Effect from "effect/Effect";
import { ProviderService } from "../ProviderService.js";
import type { FilterId } from "../types.js";
import type { TransportError } from "../../Transport/TransportError.js";

/**
 * Uninstalls a filter and frees resources.
 *
 * @param filterId - Filter ID to uninstall
 * @returns Effect yielding true if filter was found and removed
 *
 * @since 0.4.0
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { createBlockFilter, uninstallFilter, Provider, HttpTransport } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   const filterId = yield* createBlockFilter()
 *   const uninstalled = yield* uninstallFilter(filterId)
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY'))
 * )
 * ```
 */
export const uninstallFilter = (
	filterId: FilterId,
): Effect.Effect<boolean, TransportError, ProviderService> =>
	Effect.flatMap(ProviderService, (svc) =>
		svc.request<boolean>("eth_uninstallFilter", [filterId]),
	);
