/**
 * @fileoverview Free function to subscribe to Ethereum events via eth_subscribe.
 *
 * @module Provider/functions/subscribe
 * @since 0.4.0
 */

import * as Effect from "effect/Effect";
import { ProviderService } from "../ProviderService.js";
import type { TransportError } from "../../Transport/TransportError.js";

/**
 * Subscribes to Ethereum events using eth_subscribe.
 *
 * Requires a WebSocket transport that supports subscriptions.
 *
 * @param subscription - Subscription type (e.g., 'newHeads', 'logs', 'newPendingTransactions')
 * @param params - Optional subscription parameters
 * @returns Effect yielding the subscription ID
 *
 * @since 0.4.0
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { subscribe, Provider, WebSocketTransport } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   // Subscribe to new block headers
 *   const subId = yield* subscribe('newHeads')
 *
 *   // Subscribe to logs with filter
 *   const logsSubId = yield* subscribe('logs', [{
 *     address: '0x...',
 *     topics: ['0x...']
 *   }])
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(WebSocketTransport('wss://mainnet.infura.io/ws/v3/YOUR_KEY'))
 * )
 * ```
 */
export const subscribe = (
	subscription: string,
	params?: readonly unknown[],
): Effect.Effect<`0x${string}`, TransportError, ProviderService> =>
	Effect.flatMap(ProviderService, (svc) =>
		svc.request<`0x${string}`>("eth_subscribe", [subscription, ...(params ?? [])]),
	);
