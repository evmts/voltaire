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
 * Uses Effect-native types:
 * - `timeout`: Effect Duration (e.g., `"30 seconds"`)
 * - Creates exponential backoff retry schedule from config values
 *
 * @example Environment variable configuration
 * ```typescript
 * // Set environment variables:
 * // HTTP_URL=https://mainnet.infura.io/v3/YOUR_KEY
 * // HTTP_TIMEOUT=60 seconds
 * // HTTP_RETRY_BASE_DELAY=1 second
 * // HTTP_RETRY_MAX_ATTEMPTS=5
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

import type * as HttpClient from "@effect/platform/HttpClient";
import * as Config from "effect/Config";
import type * as ConfigError from "effect/ConfigError";
import * as Duration from "effect/Duration";
import * as Effect from "effect/Effect";
import * as HashMap from "effect/HashMap";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import * as Schedule from "effect/Schedule";
import * as Secret from "effect/Secret";
import { HttpTransport } from "./HttpTransport.js";
import type { TransportService } from "./TransportService.js";

/**
 * Effect.Config schema for HTTP transport configuration.
 *
 * @description
 * Defines a type-safe configuration schema that can be populated from
 * environment variables, config files, or programmatic sources.
 *
 * Environment variables (when using ConfigProvider.fromEnv()):
 * - `HTTP_URL` - Required. JSON-RPC endpoint URL
 * - `HTTP_TIMEOUT` - Optional. Request timeout (e.g., "30 seconds"). Default: 30 seconds
 * - `HTTP_RETRY_BASE_DELAY` - Optional. Base delay for exponential backoff. Default: 1 second
 * - `HTTP_RETRY_MAX_ATTEMPTS` - Optional. Max retry attempts. Default: 3
 * - `HTTP_HEADERS_*` - Optional. Custom headers (e.g., HTTP_HEADERS_X_API_KEY=value)
 * - `HTTP_API_KEY` - Optional. API key (stored as Secret, auto-redacted in logs)
 *
 * The retry schedule uses exponential backoff with jitter based on `retryBaseDelay`
 * and `retryMaxAttempts`.
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
	retryBaseDelay: Config.duration("retryBaseDelay").pipe(
		Config.withDefault(Duration.seconds(1)),
	),
	retryMaxAttempts: Config.integer("retryMaxAttempts").pipe(
		Config.withDefault(3),
	),
	headers: Config.hashMap(Config.string(), "headers").pipe(
		Config.withDefault(HashMap.empty()),
	),
	apiKey: Config.secret("apiKey").pipe(Config.option),
}).pipe(Config.nested("http"));

/**
 * Type representing the resolved HTTP transport configuration.
 *
 * @since 0.0.1
 */
export type HttpTransportConfigType = Config.Config.Success<
	typeof HttpTransportConfigSchema
>;

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
 *   ['http.timeout', '60 seconds'],
 *   ['http.retryBaseDelay', '500 millis'],
 *   ['http.retryMaxAttempts', '5'],
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
	ConfigError.ConfigError,
	HttpClient.HttpClient
> = Layer.unwrapEffect(
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

		// Build retry schedule from config: exponential backoff with jitter
		const retrySchedule = Schedule.exponential(config.retryBaseDelay).pipe(
			Schedule.jittered,
			Schedule.intersect(Schedule.recurs(config.retryMaxAttempts)),
		);

		// Return the HttpTransport layer with resolved config
		return HttpTransport({
			url: config.url,
			timeout: config.timeout,
			retrySchedule,
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
> = Layer.unwrapEffect(
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

		// Build retry schedule from config: exponential backoff with jitter
		const retrySchedule = Schedule.exponential(config.retryBaseDelay).pipe(
			Schedule.jittered,
			Schedule.intersect(Schedule.recurs(config.retryMaxAttempts)),
		);

		// Import FetchHttpClient dynamically to avoid circular deps
		const { FetchHttpClient } = yield* Effect.promise(
			() => import("@effect/platform"),
		);

		return Layer.provide(
			HttpTransport({
				url: config.url,
				timeout: config.timeout,
				retrySchedule,
				headers: Object.keys(headers).length > 0 ? headers : undefined,
			}),
			FetchHttpClient.layer,
		);
	}),
);
