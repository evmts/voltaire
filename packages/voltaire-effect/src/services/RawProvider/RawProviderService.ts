/**
 * @fileoverview Raw Provider service for direct EIP-1193 provider access.
 *
 * @module RawProviderService
 * @since 0.0.1
 *
 * @description
 * Provides direct access to the underlying EIP-1193 provider instance.
 * Use this when you need features not exposed by ProviderService.
 */

import * as Context from "effect/Context";
import type * as Effect from "effect/Effect";
import type { TransportError } from "../Transport/TransportError.js";

/**
 * Request arguments for EIP-1193 provider.
 */
export interface RequestArguments {
	readonly method: string;
	readonly params?: readonly unknown[] | object;
}

/**
 * Shape of the raw provider service.
 */
export type RawProviderShape = {
	/**
	 * Submit EIP-1193 request directly to the provider.
	 */
	readonly request: (
		args: RequestArguments,
	) => Effect.Effect<unknown, TransportError>;
};

/**
 * Raw Provider service for direct EIP-1193 access.
 *
 * @description
 * Provides access to the underlying provider's request method for
 * advanced operations not covered by ProviderService.
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { RawProviderService, InMemoryProviderTransport } from 'voltaire-effect'
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
export class RawProviderService extends Context.Tag("RawProviderService")<
	RawProviderService,
	RawProviderShape
>() {}
