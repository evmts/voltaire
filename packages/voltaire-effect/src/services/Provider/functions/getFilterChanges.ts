/**
 * @fileoverview Free function to get filter changes.
 *
 * @module Provider/functions/getFilterChanges
 * @since 0.4.0
 */

import * as Effect from "effect/Effect";
import { ProviderService } from "../ProviderService.js";
import type { FilterId, FilterChanges } from "../types.js";
import type { TransportError } from "../../Transport/TransportError.js";

/**
 * Gets changes since last poll for the given filter.
 *
 * Returns logs for event filters, or hashes for block/pending transaction filters.
 *
 * @param filterId - Filter ID from createEventFilter/createBlockFilter/createPendingTransactionFilter
 * @returns Effect yielding logs or hashes depending on filter type
 *
 * @since 0.4.0
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { createBlockFilter, getFilterChanges, Provider, HttpTransport } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   const filterId = yield* createBlockFilter()
 *   const changes = yield* getFilterChanges(filterId)
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY'))
 * )
 * ```
 */
export const getFilterChanges = (
	filterId: FilterId,
): Effect.Effect<FilterChanges, TransportError, ProviderService> =>
	Effect.flatMap(ProviderService, (svc) =>
		svc.request<FilterChanges>("eth_getFilterChanges", [filterId]),
	);
