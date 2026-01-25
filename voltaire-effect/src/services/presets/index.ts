/**
 * @fileoverview Layer composition presets for common provider configurations.
 *
 * @module presets
 * @since 0.0.1
 *
 * @description
 * Provides convenient helper functions for composing common layer configurations.
 * These presets reduce boilerplate when setting up providers with transports.
 *
 * @example Using MainnetProvider
 * ```typescript
 * import { Effect } from 'effect'
 * import { ProviderService, MainnetProvider } from 'voltaire-effect/services'
 *
 * const program = Effect.gen(function* () {
 *   const provider = yield* ProviderService
 *   return yield* provider.getChainId()
 * }).pipe(Effect.provide(MainnetProvider('https://mainnet.infura.io/v3/YOUR_KEY')))
 *
 * await Effect.runPromise(program)
 * ```
 */

import * as Layer from "effect/Layer";
import type { ProviderService } from "../Provider/index.js";
import { Provider } from "../Provider/index.js";
import { HttpTransport } from "../Transport/index.js";

/**
 * Creates a pre-composed Provider layer with HTTP transport for mainnet.
 *
 * @description
 * Convenience function that composes Provider with HttpTransport,
 * reducing boilerplate for the most common use case.
 *
 * @param url - The JSON-RPC endpoint URL
 * @returns A composed layer providing ProviderService (fully satisfied, no dependencies)
 *
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { ProviderService, MainnetProvider } from 'voltaire-effect/services'
 *
 * const program = Effect.gen(function* () {
 *   const provider = yield* ProviderService
 *   const blockNumber = yield* provider.getBlockNumber()
 *   const chainId = yield* provider.getChainId()
 *   return { blockNumber, chainId }
 * }).pipe(Effect.provide(MainnetProvider('https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY')))
 *
 * await Effect.runPromise(program)
 * ```
 */
export const MainnetProvider = (url: string): Layer.Layer<ProviderService> =>
	Provider.pipe(Layer.provide(HttpTransport(url)));

/**
 * Creates a pre-composed Provider layer with HTTP transport.
 *
 * @description
 * Generic version of MainnetProvider for any network.
 * Composes Provider with HttpTransport for the given URL.
 *
 * @param url - The JSON-RPC endpoint URL
 * @returns A composed layer providing ProviderService (fully satisfied, no dependencies)
 *
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { ProviderService, createProvider } from 'voltaire-effect/services'
 *
 * // Works with any network
 * const arbitrumProvider = createProvider('https://arb1.arbitrum.io/rpc')
 * const optimismProvider = createProvider('https://mainnet.optimism.io')
 *
 * const program = Effect.gen(function* () {
 *   const provider = yield* ProviderService
 *   return yield* provider.getChainId()
 * }).pipe(Effect.provide(arbitrumProvider))
 * ```
 */
export const createProvider = (url: string): Layer.Layer<ProviderService> =>
	Provider.pipe(Layer.provide(HttpTransport(url)));
