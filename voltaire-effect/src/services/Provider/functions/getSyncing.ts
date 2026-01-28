/**
 * @fileoverview Free function to get syncing status.
 *
 * @module Provider/functions/getSyncing
 * @since 0.4.0
 */

import * as Effect from "effect/Effect";
import { ProviderService } from "../ProviderService.js";
import type { SyncingStatus } from "../types.js";
import type { TransportError } from "../../Transport/TransportError.js";

/**
 * Gets the syncing status of the node.
 *
 * @returns Effect yielding false if not syncing, or an object with sync progress
 *
 * @since 0.4.0
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { getSyncing, Provider, HttpTransport } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   const status = yield* getSyncing()
 *   if (status === false) {
 *     console.log('Node is fully synced')
 *   } else {
 *     console.log('Syncing:', status.currentBlock, '/', status.highestBlock)
 *   }
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY'))
 * )
 * ```
 */
export const getSyncing = (): Effect.Effect<
	SyncingStatus,
	TransportError,
	ProviderService
> =>
	Effect.flatMap(ProviderService, (svc) =>
		svc.request<false | { startingBlock: string; currentBlock: string; highestBlock: string }>(
			"eth_syncing",
		).pipe(
			Effect.map((result) => {
				if (result === false) return false;
				return {
					startingBlock: result.startingBlock,
					currentBlock: result.currentBlock,
					highestBlock: result.highestBlock,
				};
			}),
		),
	);
