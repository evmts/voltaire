/**
 * @fileoverview Effect.Config schema for HTTP transport configuration.
 *
 * @module HttpTransportConfig
 * @since 0.0.1
 *
 * @description
 * Provides type-safe configuration for HTTP transport using Effect.Config.
 * Supports reading configuration from environment variables with validation,
 * defaults, and secret handling for API keys.
 *
 * @example Environment variable configuration
 * ```typescript
 * // Set environment variables:
 * // HTTP_URL=https://mainnet.infura.io/v3/YOUR_KEY
 * // HTTP_TIMEOUT=60s
 * // HTTP_RETRIES=5
 * // HTTP_RETRY_DELAY=2s
 * // HTTP_HEADERS_X_API_KEY=your-api-key
 *
 * import { Effect, Layer, ConfigProvider } from 'effect'
 * import { HttpTransportFromConfig } from 'voltaire-effect/services'
 *
 * const program = Effect.gen(function* () {
 *   const transport = yield* TransportService
 *   return yield* transport.request('eth_blockNumber')
 * }).pipe(
 *   Effect.provide(HttpTransportFromConfig),
 *   Effect.provide(Layer.setConfigProvider(ConfigProvider.fromEnv()))
 * )
 * ```
 *
 * @see {@link HttpTransport} - Plain object configuration API
 * @see {@link TransportService} - The service interface
 */

import * as Config from "effect/Config";
import * as ConfigError from "effect/ConfigError";
import * as Duration from "effect/Duration";
import * as Effect from "effect/Effect";
import * as HashMap from "effect/HashMap";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import * as Secret from "effect/Secret";
import { HttpTransport } from "./HttpTransport.js";
import { TransportService } from "./TransportService.js";

/**
 * Effect.Config schema for HTTP transport configuration.
 *
 * @description
 * Defines a type-safe configuration schema that can be populated from
 * environment variables, config files, or programmatic sources.
 *
 * Environment variables (when using ConfigProvider.fromEnv()):
 * - `HTTP_URL` - Required. JSON-RPC endpoint URL
 * - `HTTP_TIMEOUT` - Optional. Request timeout (e.g., "30s", "1m"). Default: 30s
 * - `HTTP_RETRIES` - Optional. Number of retry attempts. Default: 3
 * - `HTTP_RETRY_DELAY` - Optional. Delay between retries. Default: 1s
 * - `HTTP_HEADERS_*` - Optional. Custom headers (e.g., HTTP_HEADERS_X_API_KEY=value)
 * - `HTTP_API_KEY` - Optional. API key (stored as Secret, auto-redacted in logs)
 *
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * import { Effect, ConfigProvider, Layer } from 'effect'
 * import { HttpTransportConfigSchema } from 'voltaire-effect/services'
 *
 * const program = Effect.gen(function* () {
 *   const config = yield* HttpTransportConfigSchema
 *   console.log('URL:', config.url)
 *   console.log('Timeout:', Duration.toMillis(config.timeout))
 * }).pipe(
 *   Effect.provide(Layer.setConfigProvider(ConfigProvider.fromEnv()))
 * )
 * ```
 */
export const HttpTransportConfigSchema = Config.all({
	url: Config.string("url").pipe(
		Config.validate({
			message: "URL must start with http:// or https://",
			validation: (s) => s.startsWith("http://") || s.startsWith("https://"),
		}),
	),
	timeout: Config.duration("timeout").pipe(
		Config.withDefault(Duration.seconds(30)),
	),
	retries: Config.integer("retries").pipe(
		Config.withDefault(3),
	),
	retryDelay: Config.duration("retryDelay").pipe(
		Config.withDefault(Duration.seconds(1)),
	),
	headers: Config.hashMap(Config.string(), "headers").pipe(
		Config.withDefault(HashMap.empty()),
	),
	apiKey: Config.secret("apiKey").pipe(
		Config.option,
	),
}).pipe(Config.nested("http"));

/**
 * Type representing the resolved HTTP transport configuration.
 *
 * @since 0.0.1
 */
export type HttpTransportConfigType = Config.Config.Success<typeof HttpTransportConfigSchema>;

/**
 * Layer that creates an HTTP transport from Effect.Config.
 *
 * @description
 * Reads configuration from the ConfigProvider (environment, files, etc.)
 * and creates an HTTP transport layer. Supports automatic secret handling
 * for API keys.
 *
 * @since 0.0.1
 *
 * @example Environment variables
 * ```typescript
 * import { Effect, Layer, ConfigProvider } from 'effect'
 * import { FetchHttpClient } from '@effect/platform'
 * import { HttpTransportFromConfig, TransportService } from 'voltaire-effect/services'
 *
 * // Set: HTTP_URL=https://mainnet.infura.io/v3/KEY
 *
 * const program = Effect.gen(function* () {
 *   const transport = yield* TransportService
 *   return yield* transport.request('eth_blockNumber')
 * }).pipe(
 *   Effect.provide(HttpTransportFromConfig),
 *   Effect.provide(FetchHttpClient.layer),
 *   Effect.provide(Layer.setConfigProvider(ConfigProvider.fromEnv()))
 * )
 * ```
 *
 * @example Programmatic config
 * ```typescript
 * import { Effect, Layer, ConfigProvider } from 'effect'
 * import { FetchHttpClient } from '@effect/platform'
 * import { HttpTransportFromConfig, TransportService } from 'voltaire-effect/services'
 *
 * const configProvider = ConfigProvider.fromMap(new Map([
 *   ['http.url', 'https://mainnet.infura.io/v3/KEY'],
 *   ['http.timeout', '60s'],
 *   ['http.retries', '5'],
 * ]))
 *
 * const program = Effect.gen(function* () {
 *   const transport = yield* TransportService
 *   return yield* transport.request('eth_blockNumber')
 * }).pipe(
 *   Effect.provide(HttpTransportFromConfig),
 *   Effect.provide(FetchHttpClient.layer),
 *   Effect.provide(Layer.setConfigProvider(configProvider))
 * )
 * ```
 */
export const HttpTransportFromConfig: Layer.Layer<
	TransportService,
	ConfigError.ConfigError
> = Layer.unwrap(
	Effect.gen(function* () {
		const config = yield* HttpTransportConfigSchema;

		// Build headers from HashMap + optional API key
		const baseHeaders = Object.fromEntries(
			HashMap.toEntries(config.headers).map(([k, v]) => [k, v]),
		);

		const headers = Option.match(config.apiKey, {
			onNone: () => baseHeaders,
			onSome: (secret) => ({
				...baseHeaders,
				Authorization: `Bearer ${Secret.value(secret)}`,
			}),
		});

		// Return the HttpTransport layer with resolved config
		return HttpTransport({
			url: config.url,
			timeout: Duration.toMillis(config.timeout),
			retries: config.retries,
			retryDelay: Duration.toMillis(config.retryDelay),
			headers: Object.keys(headers).length > 0 ? headers : undefined,
		});
	}),
);

/**
 * Creates a config-based HTTP transport with FetchHttpClient bundled.
 *
 * @description
 * Convenience layer that combines HttpTransportFromConfig with FetchHttpClient,
 * so you only need to provide the ConfigProvider.
 *
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * import { Effect, Layer, ConfigProvider } from 'effect'
 * import { HttpTransportFromConfigFetch, TransportService } from 'voltaire-effect/services'
 *
 * const program = Effect.gen(function* () {
 *   const transport = yield* TransportService
 *   return yield* transport.request('eth_blockNumber')
 * }).pipe(
 *   Effect.provide(HttpTransportFromConfigFetch),
 *   Effect.provide(Layer.setConfigProvider(ConfigProvider.fromEnv()))
 * )
 * ```
 */
export const HttpTransportFromConfigFetch: Layer.Layer<
	TransportService,
	ConfigError.ConfigError
> = Layer.unwrap(
	Effect.gen(function* () {
		const config = yield* HttpTransportConfigSchema;

		const baseHeaders = Object.fromEntries(
			HashMap.toEntries(config.headers).map(([k, v]) => [k, v]),
		);

		const headers = Option.match(config.apiKey, {
			onNone: () => baseHeaders,
			onSome: (secret) => ({
				...baseHeaders,
				Authorization: `Bearer ${Secret.value(secret)}`,
			}),
		});

		// Import FetchHttpClient dynamically to avoid circular deps
		const { FetchHttpClient } = yield* Effect.promise(() =>
			import("@effect/platform"),
		);

		return Layer.provide(
			HttpTransport({
				url: config.url,
				timeout: Duration.toMillis(config.timeout),
				retries: config.retries,
				retryDelay: Duration.toMillis(config.retryDelay),
				headers: Object.keys(headers).length > 0 ? headers : undefined,
			}),
			FetchHttpClient.layer,
		);
	}),
);
