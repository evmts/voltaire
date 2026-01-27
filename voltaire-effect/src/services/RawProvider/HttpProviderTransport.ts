/**
 * @fileoverview HttpProvider transport layer for Effect.
 *
 * @module HttpProviderTransport
 * @since 0.0.1
 *
 * @description
 * Wraps voltaire's HttpProvider as an Effect transport layer.
 * Use when you need compatibility with existing HttpProvider instances.
 */

import {
	HttpProvider,
	type HttpProviderOptions,
} from "@tevm/voltaire/provider";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { TransportError } from "../Transport/TransportError.js";
import { TransportService } from "../Transport/TransportService.js";

/**
 * Creates a TransportService layer from HttpProvider.
 *
 * @description
 * Wraps voltaire's HttpProvider as an Effect TransportService.
 * For new code, prefer `HttpTransport` which is pure Effect.
 *
 * @param options - HttpProvider URL or configuration
 * @returns Layer providing TransportService
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { Provider, ProviderService, HttpProviderTransport } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   const provider = yield* ProviderService
 *   return yield* provider.getBlockNumber()
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(HttpProviderTransport('https://eth.llamarpc.com'))
 * )
 * ```
 */
export const HttpProviderTransport = (
	options: HttpProviderOptions | string,
): Layer.Layer<TransportService> => {
	const provider = new HttpProvider(options);

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
