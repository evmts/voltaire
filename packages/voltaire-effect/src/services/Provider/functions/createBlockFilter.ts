/**
 * @fileoverview Free function to create a block filter.
 *
 * @module Provider/functions/createBlockFilter
 * @since 0.4.0
 */

import * as Effect from "effect/Effect";
import { ProviderService } from "../ProviderService.js";
import type { FilterId } from "../types.js";
import type { TransportError } from "../../Transport/TransportError.js";

/**
 * Creates a filter to notify when new blocks are mined.
 *
 * @returns Effect yielding filter ID for use with getFilterChanges
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
 *   const newBlockHashes = yield* getFilterChanges(filterId)
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY'))
 * )
 * ```
 */
export const createBlockFilter = (): Effect.Effect<
	FilterId,
	TransportError,
	ProviderService
> =>
	Effect.flatMap(ProviderService, (svc) =>
		svc.request<FilterId>("eth_newBlockFilter", []),
	);
