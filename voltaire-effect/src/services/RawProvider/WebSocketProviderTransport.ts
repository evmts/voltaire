/**
 * @fileoverview WebSocketProvider transport layer for Effect.
 *
 * @module WebSocketProviderTransport
 * @since 0.0.1
 *
 * @description
 * Wraps voltaire's WebSocketProvider as an Effect transport layer.
 * Supports real-time subscriptions via WebSocket.
 */

import {
	WebSocketProvider,
	type WebSocketProviderOptions,
} from "@tevm/voltaire/provider";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { TransportError } from "../Transport/TransportError.js";
import { TransportService } from "../Transport/TransportService.js";

/**
 * Creates a TransportService layer from WebSocketProvider.
 *
 * @description
 * Wraps voltaire's WebSocketProvider as an Effect TransportService.
 * Requires WebSocket to be available (browser or polyfill in Node).
 *
 * Note: The layer creates a scoped resource that manages the WebSocket
 * connection lifecycle. Use with Effect.scoped.
 *
 * @param options - WebSocketProvider URL or configuration
 * @returns Layer providing TransportService (scoped)
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { Provider, ProviderService, WebSocketProviderTransport } from 'voltaire-effect/services'
 *
 * const program = Effect.gen(function* () {
 *   const provider = yield* ProviderService
 *   return yield* provider.getBlockNumber()
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(WebSocketProviderTransport('wss://eth.llamarpc.com')),
 *   Effect.scoped
 * )
 * ```
 */
export const WebSocketProviderTransport = (
	options: WebSocketProviderOptions | string,
): Layer.Layer<TransportService, TransportError> => {
	const config = typeof options === "string" ? { url: options } : options;

	return Layer.scoped(
		TransportService,
		Effect.gen(function* () {
			const provider = new WebSocketProvider(config);

			yield* Effect.tryPromise({
				try: () => provider.connect(),
				catch: (error): TransportError =>
					new TransportError({
						code: -32603,
						message:
							error instanceof Error
								? error.message
								: "WebSocket connection failed",
					}),
			});

			yield* Effect.addFinalizer(() =>
				Effect.sync(() => {
					provider.disconnect();
				}),
			);

			return {
				request: <T>(
					method: string,
					params: unknown[] = [],
				): Effect.Effect<T, TransportError> =>
					Effect.tryPromise({
						try: () => provider.request({ method, params }) as Promise<T>,
						catch: (error): TransportError => {
							if (
								error &&
								typeof error === "object" &&
								"code" in error &&
								"message" in error
							) {
								return new TransportError({
									code: (error as { code: number }).code,
									message: (error as { message: string }).message,
								});
							}
							return new TransportError({
								code: -32603,
								message:
									error instanceof Error ? error.message : "Unknown error",
							});
						},
					}),
			};
		}),
	);
};
