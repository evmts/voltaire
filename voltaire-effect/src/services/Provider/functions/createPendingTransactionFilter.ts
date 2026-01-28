/**
 * @fileoverview Free function to create a pending transaction filter.
 *
 * @module Provider/functions/createPendingTransactionFilter
 * @since 0.4.0
 */

import * as Effect from "effect/Effect";
import { ProviderService } from "../ProviderService.js";
import type { FilterId } from "../types.js";
import type { TransportError } from "../../Transport/TransportError.js";

/**
 * Creates a filter to notify when new pending transactions are added to the mempool.
 *
 * @returns Effect yielding filter ID for use with getFilterChanges
 *
 * @since 0.4.0
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { createPendingTransactionFilter, getFilterChanges, Provider, HttpTransport } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   const filterId = yield* createPendingTransactionFilter()
 *   const pendingTxHashes = yield* getFilterChanges(filterId)
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY'))
 * )
 * ```
 */
export const createPendingTransactionFilter = (): Effect.Effect<
	FilterId,
	TransportError,
	ProviderService
> =>
	Effect.flatMap(ProviderService, (svc) =>
		svc.request<FilterId>("eth_newPendingTransactionFilter", []),
	);
