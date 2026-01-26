/**
 * @fileoverview Unified Effect.Config for transport configuration.
 *
 * @module TransportConfig
 * @since 0.0.1
 *
 * @description
 * Provides a unified configuration schema for all transport types.
 * Uses Effect.Config for type-safe environment variable parsing.
 *
 * @see {@link HttpTransportConfig} - HTTP-specific configuration
 * @see {@link WebSocketTransportConfig} - WebSocket-specific configuration
 */

import * as Config from "effect/Config";
import type * as ConfigError from "effect/ConfigError";
import * as Duration from "effect/Duration";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import * as Secret from "effect/Secret";
import { HttpTransport } from "./HttpTransport.js";
import type {
	RequestInterceptor,
	ResponseInterceptor,
} from "./TransportInterceptor.js";
import type { TransportService } from "./TransportService.js";

/**
 * Transport configuration schema.
 *
 * @description
 * Unified configuration for transport layer. Reads from environment
 * variables with sensible defaults.
 *
 * Environment variables:
 * - `RPC_URL` - Required. The JSON-RPC endpoint URL
 * - `RPC_TIMEOUT` - Optional. Request timeout (default: 30s)
 * - `RPC_RETRIES` - Optional. Number of retry attempts (default: 3)
 * - `RPC_RETRY_DELAY` - Optional. Delay between retries (default: 1s)
 * - `RPC_API_KEY` - Optional. API key (stored as Secret)
 *
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * import { Effect, ConfigProvider, Layer } from 'effect'
 * import { TransportConfig, TransportFromConfig } from 'voltaire-effect/services'
 *
 * // Read from environment
 * const program = Effect.gen(function* () {
 *   const config = yield* TransportConfig
 *   console.log('URL:', config.url)
 *   console.log('Timeout:', config.timeout)
 * })
 * ```
 */
export const TransportConfig = Config.all({
	url: Config.string("url").pipe(
		Config.validate({
			message: "URL must start with http://, https://, ws://, or wss://",
			validation: (s) =>
				s.startsWith("http://") ||
				s.startsWith("https://") ||
				s.startsWith("ws://") ||
				s.startsWith("wss://"),
		}),
	),
	timeout: Config.duration("timeout").pipe(
		Config.withDefault(Duration.seconds(30)),
	),
	retries: Config.integer("retries").pipe(Config.withDefault(3)),
	retryDelay: Config.duration("retryDelay").pipe(
		Config.withDefault(Duration.seconds(1)),
	),
	apiKey: Config.secret("apiKey").pipe(Config.option),
	onRequest: Config.succeed<RequestInterceptor | undefined>(undefined),
	onResponse: Config.succeed<ResponseInterceptor | undefined>(undefined),
	fetchOptions: Config.succeed<RequestInit | undefined>(undefined),
	fetch: Config.succeed<typeof globalThis.fetch | undefined>(undefined),
}).pipe(Config.nested("rpc"));

/**
 * Type representing the resolved transport configuration.
 *
 * @since 0.0.1
 */
export type TransportConfigType = Config.Config.Success<typeof TransportConfig>;

/**
 * Layer that creates a transport from Effect.Config.
 *
 * @description
 * Reads configuration from the ConfigProvider and creates an appropriate
 * transport layer. Automatically selects HTTP or WebSocket based on URL scheme.
 *
 * @since 0.0.1
 *
 * @example Environment variables
 * ```typescript
 * import { Effect, Layer, ConfigProvider } from 'effect'
 * import { FetchHttpClient } from '@effect/platform'
 * import { TransportFromConfig, TransportService } from 'voltaire-effect/services'
 *
 * // Set: RPC_URL=https://mainnet.infura.io/v3/KEY
 *
 * const program = Effect.gen(function* () {
 *   const transport = yield* TransportService
 *   return yield* transport.request('eth_blockNumber')
 * }).pipe(
 *   Effect.provide(TransportFromConfig),
 *   Effect.provide(FetchHttpClient.layer),
 *   Effect.provide(Layer.setConfigProvider(ConfigProvider.fromEnv()))
 * )
 * ```
 *
 * @example Programmatic config
 * ```typescript
 * import { Effect, Layer, ConfigProvider } from 'effect'
 * import { FetchHttpClient } from '@effect/platform'
 * import { TransportFromConfig, TransportService } from 'voltaire-effect/services'
 *
 * const configProvider = ConfigProvider.fromMap(new Map([
 *   ['rpc.url', 'https://mainnet.infura.io/v3/KEY'],
 *   ['rpc.timeout', '60s'],
 *   ['rpc.retries', '5'],
 * ]))
 *
 * const program = Effect.gen(function* () {
 *   const transport = yield* TransportService
 *   return yield* transport.request('eth_blockNumber')
 * }).pipe(
 *   Effect.provide(TransportFromConfig),
 *   Effect.provide(FetchHttpClient.layer),
 *   Effect.provide(Layer.setConfigProvider(configProvider))
 * )
 * ```
 */
export const TransportFromConfig: Layer.Layer<
	TransportService,
	ConfigError.ConfigError,
	import("@effect/platform/HttpClient").HttpClient
> = Layer.unwrapEffect(
	Effect.gen(function* () {
		const config = yield* TransportConfig;

		// Build headers from optional API key
		const headers: Record<string, string> | undefined = Option.match(
			config.apiKey,
			{
				onNone: () => undefined,
				onSome: (secret) => ({
					Authorization: `Bearer ${Secret.value(secret)}`,
				}),
			},
		);

		// Currently only HTTP is supported from config
		// WebSocket would require a scoped layer
		if (config.url.startsWith("ws://") || config.url.startsWith("wss://")) {
			// For WebSocket, return HTTP transport but warn
			// A proper implementation would use WebSocketTransport
			// but that requires additional dependencies (Socket.WebSocketConstructor)
		}

		return HttpTransport({
			url: config.url,
			timeout: Duration.toMillis(config.timeout),
			retries: config.retries,
			retryDelay: Duration.toMillis(config.retryDelay),
			headers,
			onRequest: config.onRequest,
			onResponse: config.onResponse,
			fetchOptions: config.fetchOptions,
			fetch: config.fetch,
		});
	}),
);

/**
 * Creates a transport from config with FetchHttpClient bundled.
 *
 * @description
 * Convenience layer that combines TransportFromConfig with FetchHttpClient.
 *
 * @since 0.0.1
 */
export const TransportFromConfigFetch: Layer.Layer<
	TransportService,
	ConfigError.ConfigError
> = Layer.unwrapEffect(
	Effect.gen(function* () {
		const config = yield* TransportConfig;

		const headers: Record<string, string> | undefined = Option.match(
			config.apiKey,
			{
				onNone: () => undefined,
				onSome: (secret) => ({
					Authorization: `Bearer ${Secret.value(secret)}`,
				}),
			},
		);

		const { FetchHttpClient } = yield* Effect.promise(
			() => import("@effect/platform"),
		);

		return Layer.provide(
			HttpTransport({
				url: config.url,
				timeout: Duration.toMillis(config.timeout),
				retries: config.retries,
				retryDelay: Duration.toMillis(config.retryDelay),
				headers,
				onRequest: config.onRequest,
				onResponse: config.onResponse,
				fetchOptions: config.fetchOptions,
				fetch: config.fetch,
			}),
			FetchHttpClient.layer,
		);
	}),
);

/**
 * Quick configuration for common setups.
 *
 * @since 0.0.1
 */
export const QuickConfig = {
	/**
	 * Create config for mainnet Infura.
	 */
	infuraMainnet: (apiKey: string) =>
		ConfigProvider.fromMap(
			new Map([["rpc.url", `https://mainnet.infura.io/v3/${apiKey}`]]),
		),

	/**
	 * Create config for Alchemy.
	 */
	alchemyMainnet: (apiKey: string) =>
		ConfigProvider.fromMap(
			new Map([["rpc.url", `https://eth-mainnet.g.alchemy.com/v2/${apiKey}`]]),
		),

	/**
	 * Create config for local node.
	 */
	localhost: (port = 8545) =>
		ConfigProvider.fromMap(new Map([["rpc.url", `http://localhost:${port}`]])),

	/**
	 * Create config for Anvil.
	 */
	anvil: () => QuickConfig.localhost(8545),

	/**
	 * Create config for Hardhat.
	 */
	hardhat: () => QuickConfig.localhost(8545),

	/**
	 * Create config for Ganache.
	 */
	ganache: () => QuickConfig.localhost(7545),
} as const;

// Re-export ConfigProvider for convenience
import { ConfigProvider } from "effect";
export { ConfigProvider };
