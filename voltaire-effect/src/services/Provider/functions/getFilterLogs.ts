/**
 * @fileoverview Free function to get all logs for an event filter.
 *
 * @module Provider/functions/getFilterLogs
 * @since 0.4.0
 */

import * as Effect from "effect/Effect";
import { ProviderService } from "../ProviderService.js";
import type { FilterId, LogType } from "../types.js";
import type { TransportError } from "../../Transport/TransportError.js";

/**
 * Gets all logs matching the filter since it was created.
 *
 * Only works for event filters created with createEventFilter.
 *
 * @param filterId - Filter ID from createEventFilter
 * @returns Effect yielding array of logs
 *
 * @since 0.4.0
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { createEventFilter, getFilterLogs, Provider, HttpTransport } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   const filterId = yield* createEventFilter({
 *     address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
 *   })
 *   const logs = yield* getFilterLogs(filterId)
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY'))
 * )
 * ```
 */
export const getFilterLogs = (
	filterId: FilterId,
): Effect.Effect<LogType[], TransportError, ProviderService> =>
	Effect.flatMap(ProviderService, (svc) =>
		svc.request<LogType[]>("eth_getFilterLogs", [filterId]),
	);
