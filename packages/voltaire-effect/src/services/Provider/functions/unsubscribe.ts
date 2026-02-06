/**
 * @fileoverview Free function to unsubscribe from Ethereum events via eth_unsubscribe.
 *
 * @module Provider/functions/unsubscribe
 * @since 0.4.0
 */

import * as Effect from "effect/Effect";
import { ProviderService } from "../ProviderService.js";
import type { TransportError } from "../../Transport/TransportError.js";

/**
 * Unsubscribes from an Ethereum subscription using eth_unsubscribe.
 *
 * @param subscriptionId - The subscription ID returned by subscribe()
 * @returns Effect yielding true if successfully unsubscribed, false otherwise
 *
 * @since 0.4.0
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { subscribe, unsubscribe, Provider, WebSocketTransport } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   const subId = yield* subscribe('newHeads')
 *   // ... do work ...
 *   const unsubscribed = yield* unsubscribe(subId)
 *   console.log('Unsubscribed:', unsubscribed)
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(WebSocketTransport('wss://mainnet.infura.io/ws/v3/YOUR_KEY'))
 * )
 * ```
 */
export const unsubscribe = (
	subscriptionId: `0x${string}`,
): Effect.Effect<boolean, TransportError, ProviderService> =>
	Effect.flatMap(ProviderService, (svc) =>
		svc.request<boolean>("eth_unsubscribe", [subscriptionId]),
	);
