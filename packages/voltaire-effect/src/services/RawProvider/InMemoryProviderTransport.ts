/**
 * @fileoverview InMemoryProvider transport layer for Effect.
 *
 * @module InMemoryProviderTransport
 * @since 0.0.1
 *
 * @description
 * Wraps voltaire's InMemoryProvider as an Effect transport layer.
 * Provides a fully local in-memory Ethereum environment for testing.
 */

import {
	InMemoryProvider,
	type InMemoryProviderOptions,
} from "@tevm/voltaire/provider";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { TransportError } from "../Transport/TransportError.js";
import { TransportService } from "../Transport/TransportService.js";

/**
 * Creates a TransportService layer from InMemoryProvider.
 *
 * @description
 * Wraps voltaire's InMemoryProvider as an Effect TransportService.
 * The provider runs a fully local in-memory Ethereum node for testing.
 *
 * @param options - InMemoryProvider configuration
 * @returns Layer providing TransportService
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { Provider, getBlockNumber, InMemoryProviderTransport } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   const blockNumber = yield* getBlockNumber()
 *   return blockNumber
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(InMemoryProviderTransport({ chainId: 1 }))
 * )
 * ```
 */
export const InMemoryProviderTransport = (
	options: InMemoryProviderOptions = {},
): Layer.Layer<TransportService> => {
	const provider = new InMemoryProvider(options);

	return Layer.succeed(TransportService, {
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
						message: error instanceof Error ? error.message : "Unknown error",
					});
				},
			}),
	});
};

/**
 * Tag for accessing the raw InMemoryProvider instance.
 */
export const InMemoryProviderTag = "@voltaire-effect/InMemoryProvider" as const;
