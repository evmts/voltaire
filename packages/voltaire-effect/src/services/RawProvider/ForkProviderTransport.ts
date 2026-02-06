/**
 * @fileoverview ForkProvider transport layer for Effect.
 *
 * @module ForkProviderTransport
 * @since 0.0.1
 *
 * @description
 * Wraps voltaire's ForkProvider as an Effect transport layer.
 * Enables forking mainnet state at a specific block for local testing.
 */

import {
	ForkProvider,
	type ForkProviderOptions,
} from "@tevm/voltaire/provider";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { TransportError } from "../Transport/TransportError.js";
import { TransportService } from "../Transport/TransportService.js";

/**
 * Creates a TransportService layer from ForkProvider.
 *
 * @description
 * Wraps voltaire's ForkProvider as an Effect TransportService.
 * Forks from an upstream RPC at a specific block, enabling local
 * testing against mainnet state.
 *
 * The layer creates a scoped resource that manages FFI initialization
 * and cleanup. Use with Effect.scoped.
 *
 * @param options - ForkProvider configuration
 * @returns Layer providing TransportService (scoped)
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { Provider, getBalance, ForkProviderTransport } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   const balance = yield* getBalance('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045')
 *   return balance
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(ForkProviderTransport({
 *     fork: {
 *       forkUrl: 'https://eth.llamarpc.com',
 *       forkBlockNumber: 18000000n
 *     },
 *     chainId: 1
 *   })),
 *   Effect.scoped
 * )
 * ```
 */
export const ForkProviderTransport = (
	options: ForkProviderOptions,
): Layer.Layer<TransportService> => {
	return Layer.scoped(
		TransportService,
		Effect.gen(function* () {
			const provider = new ForkProvider(options);

			yield* Effect.addFinalizer(() =>
				Effect.sync(() => {
					provider.destroy();
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
