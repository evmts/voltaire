/**
 * @fileoverview Free function to create an event filter.
 *
 * @module Provider/functions/createEventFilter
 * @since 0.4.0
 */

import * as Effect from "effect/Effect";
import { ProviderService } from "../ProviderService.js";
import type { EventFilter, FilterId } from "../types.js";
import { formatLogFilterParams } from "../utils.js";
import type { TransportError } from "../../Transport/TransportError.js";

/**
 * Creates a filter for logs matching the given criteria.
 *
 * @param filter - Event filter parameters (address, topics, fromBlock, toBlock)
 * @returns Effect yielding filter ID for use with getFilterChanges/getFilterLogs
 *
 * @since 0.4.0
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { createEventFilter, getFilterChanges, Provider, HttpTransport } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   const filterId = yield* createEventFilter({
 *     address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
 *   })
 *   const changes = yield* getFilterChanges(filterId)
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY'))
 * )
 * ```
 */
export const createEventFilter = (
	filter: EventFilter = {},
): Effect.Effect<FilterId, TransportError, ProviderService> =>
	Effect.flatMap(ProviderService, (svc) =>
		svc.request<FilterId>("eth_newFilter", [formatLogFilterParams(filter)]),
	);
