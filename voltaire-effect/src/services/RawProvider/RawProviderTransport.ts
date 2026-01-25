/**
 * @fileoverview RawProvider transport layer for direct provider access.
 *
 * @module RawProviderTransport
 * @since 0.0.1
 *
 * @description
 * Provides a layer that bridges TransportService to RawProviderService,
 * enabling direct EIP-1193 provider access.
 */

import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { TransportError } from "../Transport/TransportError.js";
import { TransportService } from "../Transport/TransportService.js";
import { RawProviderService } from "./RawProviderService.js";

/**
 * Layer that provides RawProviderService using TransportService.
 *
 * @description
 * Bridges the TransportService to RawProviderService, wrapping the
 * transport's request method with EIP-1193 compatible interface.
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { RawProviderService, RawProviderTransport, InMemoryProviderTransport } from 'voltaire-effect/services'
 *
 * const program = Effect.gen(function* () {
 *   const raw = yield* RawProviderService
 *   const snapshotId = yield* raw.request({ method: 'evm_snapshot', params: [] })
 *   return snapshotId
 * }).pipe(
 *   Effect.provide(RawProviderTransport),
 *   Effect.provide(InMemoryProviderTransport({ chainId: 1 }))
 * )
 * ```
 */
export const RawProviderTransport: Layer.Layer<
	RawProviderService,
	never,
	TransportService
> = Layer.effect(
	RawProviderService,
	Effect.gen(function* () {
		const transport = yield* TransportService;

		return {
			request: (args) =>
				transport
					.request(args.method, args.params as unknown[] | undefined)
					.pipe(
						Effect.mapError(
							(e) =>
								new TransportError({
									code: e.code,
									message: e.message,
								}),
						),
					),
		};
	}),
);
