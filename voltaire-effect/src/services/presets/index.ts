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

import { FetchHttpClient } from "@effect/platform";
import * as Layer from "effect/Layer";
import { CacheService, MemoryCache } from "../Cache/index.js";
import {
	arbitrum,
	base,
	ChainService,
	mainnet,
	optimism,
	polygon,
	sepolia,
} from "../Chain/index.js";
import {
	DefaultFeeEstimator,
	FeeEstimatorService,
} from "../FeeEstimator/index.js";
import { DefaultFormatter, FormatterService } from "../Formatter/index.js";
import {
	DefaultNonceManager,
	NonceManagerService,
} from "../NonceManager/index.js";
import { Provider, ProviderService } from "../Provider/index.js";
import {
	DefaultTransactionSerializer,
	TransactionSerializerService,
} from "../TransactionSerializer/index.js";
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
	Provider.pipe(
		Layer.provide(HttpTransport(url)),
		Layer.provide(FetchHttpClient.layer),
	);

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
	Provider.pipe(
		Layer.provide(HttpTransport(url)),
		Layer.provide(FetchHttpClient.layer),
	);

/**
 * Type alias for the composed services provided by chain presets.
 */
export type ComposedServices =
	| ProviderService
	| FormatterService
	| TransactionSerializerService
	| FeeEstimatorService
	| NonceManagerService
	| CacheService
	| ChainService;

/**
 * Creates a fully composed Optimism provider with all services.
 *
 * @param url - The JSON-RPC endpoint URL
 * @returns A composed layer providing all services for Optimism
 *
 * @since 0.0.1
 */
export const OptimismProvider = (
	url: string,
): Layer.Layer<ComposedServices> => {
	const transport = HttpTransport(url).pipe(Layer.provide(FetchHttpClient.layer));
	const providerLayer = Provider.pipe(Layer.provide(transport));
	return Layer.mergeAll(
		providerLayer,
		DefaultFormatter,
		DefaultTransactionSerializer.Live,
		DefaultFeeEstimator.pipe(Layer.provide(providerLayer)),
		DefaultNonceManager.pipe(Layer.provide(providerLayer)),
		MemoryCache(),
		optimism,
	);
};

/**
 * Creates a fully composed Arbitrum provider with all services.
 *
 * @param url - The JSON-RPC endpoint URL
 * @returns A composed layer providing all services for Arbitrum
 *
 * @since 0.0.1
 */
export const ArbitrumProvider = (
	url: string,
): Layer.Layer<ComposedServices> => {
	const transport = HttpTransport(url).pipe(Layer.provide(FetchHttpClient.layer));
	const providerLayer = Provider.pipe(Layer.provide(transport));
	return Layer.mergeAll(
		providerLayer,
		DefaultFormatter,
		DefaultTransactionSerializer.Live,
		DefaultFeeEstimator.pipe(Layer.provide(providerLayer)),
		DefaultNonceManager.pipe(Layer.provide(providerLayer)),
		MemoryCache(),
		arbitrum,
	);
};

/**
 * Creates a fully composed Base provider with all services.
 *
 * @param url - The JSON-RPC endpoint URL
 * @returns A composed layer providing all services for Base
 *
 * @since 0.0.1
 */
export const BaseProvider = (url: string): Layer.Layer<ComposedServices> => {
	const transport = HttpTransport(url).pipe(Layer.provide(FetchHttpClient.layer));
	const providerLayer = Provider.pipe(Layer.provide(transport));
	return Layer.mergeAll(
		providerLayer,
		DefaultFormatter,
		DefaultTransactionSerializer.Live,
		DefaultFeeEstimator.pipe(Layer.provide(providerLayer)),
		DefaultNonceManager.pipe(Layer.provide(providerLayer)),
		MemoryCache(),
		base,
	);
};

/**
 * Creates a fully composed Sepolia provider with all services.
 *
 * @param url - The JSON-RPC endpoint URL
 * @returns A composed layer providing all services for Sepolia testnet
 *
 * @since 0.0.1
 */
export const SepoliaProvider = (
	url: string,
): Layer.Layer<ComposedServices> => {
	const transport = HttpTransport(url).pipe(Layer.provide(FetchHttpClient.layer));
	const providerLayer = Provider.pipe(Layer.provide(transport));
	return Layer.mergeAll(
		providerLayer,
		DefaultFormatter,
		DefaultTransactionSerializer.Live,
		DefaultFeeEstimator.pipe(Layer.provide(providerLayer)),
		DefaultNonceManager.pipe(Layer.provide(providerLayer)),
		MemoryCache(),
		sepolia,
	);
};

/**
 * Creates a fully composed Polygon provider with all services.
 *
 * @param url - The JSON-RPC endpoint URL
 * @returns A composed layer providing all services for Polygon
 *
 * @since 0.0.1
 */
export const PolygonProvider = (
	url: string,
): Layer.Layer<ComposedServices> => {
	const transport = HttpTransport(url).pipe(Layer.provide(FetchHttpClient.layer));
	const providerLayer = Provider.pipe(Layer.provide(transport));
	return Layer.mergeAll(
		providerLayer,
		DefaultFormatter,
		DefaultTransactionSerializer.Live,
		DefaultFeeEstimator.pipe(Layer.provide(providerLayer)),
		DefaultNonceManager.pipe(Layer.provide(providerLayer)),
		MemoryCache(),
		polygon,
	);
};

/**
 * Enhanced Mainnet provider with all composed services.
 *
 * @param url - The JSON-RPC endpoint URL
 * @returns A composed layer providing all services for Ethereum mainnet
 *
 * @since 0.0.1
 */
export const MainnetFullProvider = (
	url: string,
): Layer.Layer<ComposedServices> => {
	const transport = HttpTransport(url).pipe(Layer.provide(FetchHttpClient.layer));
	const providerLayer = Provider.pipe(Layer.provide(transport));
	return Layer.mergeAll(
		providerLayer,
		DefaultFormatter,
		DefaultTransactionSerializer.Live,
		DefaultFeeEstimator.pipe(Layer.provide(providerLayer)),
		DefaultNonceManager.pipe(Layer.provide(providerLayer)),
		MemoryCache(),
		mainnet,
	);
};
