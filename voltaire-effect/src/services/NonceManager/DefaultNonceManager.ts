/**
 * @fileoverview Default implementation of NonceManagerService.
 *
 * @module DefaultNonceManager
 * @since 0.0.1
 *
 * @description
 * Provides the default implementation layer for NonceManagerService.
 * Uses a Map to track nonce deltas per address and fetches base nonces
 * from the provider using eth_getTransactionCount with "pending" block tag.
 *
 * @see {@link NonceManagerService} - The service interface
 * @see {@link ProviderService} - Required dependency for fetching on-chain nonces
 */

import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as SynchronizedRef from "effect/SynchronizedRef";
import { ProviderService } from "../Provider/index.js";
import { NonceError, NonceManagerService } from "./NonceManagerService.js";

/**
 * Default implementation of the nonce manager layer.
 *
 * @description
 * Provides a concrete implementation of NonceManagerService that:
 * - Tracks nonce deltas per address using a Map
 * - Fetches base nonces from eth_getTransactionCount with "pending"
 * - Adds local delta to base nonce for accurate tracking
 *
 * The delta represents how many nonces have been consumed locally
 * but not yet reflected on-chain. This allows multiple transactions
 * to be prepared in quick succession.
 *
 * @since 0.0.1
 *
 * @example Basic usage
 * ```typescript
 * import { Effect } from 'effect'
 * import {
 *   DefaultNonceManager,
 *   NonceManagerService,
 *   Provider,
 *   HttpTransport
 * } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   const nonceManager = yield* NonceManagerService
 *   const nonce = yield* nonceManager.consume('0x1234...')
 *   return nonce
 * }).pipe(
 *   Effect.provide(DefaultNonceManager),
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('https://...'))
 * )
 * ```
 *
 * @example With layer composition
 * ```typescript
 * import { Effect, Layer } from 'effect'
 * import {
 *   DefaultNonceManager,
 *   Provider,
 *   HttpTransport
 * } from 'voltaire-effect'
 *
 * // Create a composed layer
 * const MainnetNonceManager = DefaultNonceManager.pipe(
 *   Layer.provideMerge(Provider),
 *   Layer.provide(HttpTransport('https://mainnet.infura.io/v3/...'))
 * )
 * ```
 *
 * @see {@link NonceManagerService} - The service interface
 * @see {@link ProviderService} - Required for fetching on-chain nonces
 */
export const DefaultNonceManager: Layer.Layer<NonceManagerService> =
	Layer.effect(
		NonceManagerService,
		Effect.gen(function* () {
			const deltaRef = yield* SynchronizedRef.make(new Map<string, number>());

			return {
				get: (address: string, chainId: number) =>
					Effect.gen(function* () {
						const provider = yield* ProviderService;
						const key = `${chainId}:${address.toLowerCase()}`;

						const baseNonce = yield* provider
							.getTransactionCount(address as `0x${string}`, "pending")
							.pipe(
								Effect.mapError(
									(e) =>
										new NonceError({
											address,
											message: `Failed to get transaction count: ${e.message}`,
											cause: e,
										}),
								),
							);

						const deltaMap = yield* SynchronizedRef.get(deltaRef);
						const delta = deltaMap.get(key) ?? 0;
						return Number(baseNonce) + delta;
					}),

				consume: (address: string, chainId: number) =>
					SynchronizedRef.modifyEffect(deltaRef, (deltaMap) =>
						Effect.gen(function* () {
							const provider = yield* ProviderService;
							const key = `${chainId}:${address.toLowerCase()}`;

							const baseNonce = yield* provider
								.getTransactionCount(address as `0x${string}`, "pending")
								.pipe(
									Effect.mapError(
										(e) =>
											new NonceError({
												address,
												message: `Failed to get transaction count: ${e.message}`,
												cause: e,
											}),
									),
								);

							const delta = deltaMap.get(key) ?? 0;
							const nonce = Number(baseNonce) + delta;

							const newMap = new Map(deltaMap);
							newMap.set(key, delta + 1);

							return [nonce, newMap] as const;
						}),
					),

				increment: (address: string, chainId: number) =>
					SynchronizedRef.update(deltaRef, (deltaMap) => {
						const key = `${chainId}:${address.toLowerCase()}`;
						const delta = deltaMap.get(key) ?? 0;
						const newMap = new Map(deltaMap);
						newMap.set(key, delta + 1);
						return newMap;
					}),

				reset: (address: string, chainId: number) =>
					SynchronizedRef.update(deltaRef, (deltaMap) => {
						const key = `${chainId}:${address.toLowerCase()}`;
						const newMap = new Map(deltaMap);
						newMap.delete(key);
						return newMap;
					}),
			};
		}),
	);
