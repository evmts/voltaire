/**
 * @fileoverview Effect.Config schema for WebSocket transport configuration.
 *
 * @module WebSocketTransportConfig
 * @since 0.0.1
 *
 * @description
 * Provides type-safe configuration for WebSocket transport using Effect.Config.
 * Supports reading configuration from environment variables with validation,
 * defaults, and proper duration parsing.
 *
 * @example Environment variable configuration
 * ```typescript
 * // Set environment variables:
 * // WS_URL=wss://mainnet.infura.io/ws/v3/YOUR_KEY
 * // WS_TIMEOUT=60s
 * // WS_RECONNECT=true
 * // WS_RECONNECT_MAX_ATTEMPTS=10
 * // WS_RECONNECT_DELAY=1s
 * // WS_RECONNECT_MAX_DELAY=30s
 * // WS_KEEP_ALIVE=30s
 *
 * import { Effect, Layer, ConfigProvider } from 'effect'
 * import { WebSocketTransportFromConfig, TransportService } from 'voltaire-effect/services'
 *
 * const program = Effect.gen(function* () {
 *   const transport = yield* TransportService
 *   return yield* transport.request('eth_blockNumber')
 * }).pipe(
 *   Effect.provide(WebSocketTransportFromConfig),
 *   Effect.provide(Layer.setConfigProvider(ConfigProvider.fromEnv()))
 * )
 * ```
 *
 * @see {@link WebSocketTransport} - Plain object configuration API
 * @see {@link TransportService} - The service interface
 */

import type * as Socket from "@effect/platform/Socket";
import * as Config from "effect/Config";
import type * as ConfigError from "effect/ConfigError";
import * as Duration from "effect/Duration";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import type { TransportError } from "./TransportError.js";
import type { TransportService } from "./TransportService.js";
import {
	WebSocketConstructorGlobal,
	WebSocketTransport,
} from "./WebSocketTransport.js";

/**
 * Effect.Config schema for WebSocket reconnection options.
 *
 * @since 0.0.1
 */
const ReconnectConfigSchema = Config.all({
	maxAttempts: Config.integer("maxAttempts").pipe(Config.withDefault(10)),
	delay: Config.duration("delay").pipe(Config.withDefault(Duration.seconds(1))),
	maxDelay: Config.duration("maxDelay").pipe(
		Config.withDefault(Duration.seconds(30)),
	),
	multiplier: Config.number("multiplier").pipe(Config.withDefault(2)),
}).pipe(Config.nested("reconnect"));

/**
 * Effect.Config schema for WebSocket transport configuration.
 *
 * @description
 * Defines a type-safe configuration schema that can be populated from
 * environment variables, config files, or programmatic sources.
 *
 * Environment variables (when using ConfigProvider.fromEnv()):
 * - `WS_URL` - Required. WebSocket endpoint URL (ws:// or wss://)
 * - `WS_TIMEOUT` - Optional. Request timeout (e.g., "30s", "1m"). Default: 30s
 * - `WS_PROTOCOLS` - Optional. Comma-separated WebSocket sub-protocols
 * - `WS_RECONNECT_ENABLED` - Optional. Enable auto-reconnect. Default: false
 * - `WS_RECONNECT_MAX_ATTEMPTS` - Optional. Max reconnect attempts. Default: 10
 * - `WS_RECONNECT_DELAY` - Optional. Initial reconnect delay. Default: 1s
 * - `WS_RECONNECT_MAX_DELAY` - Optional. Max reconnect delay. Default: 30s
 * - `WS_RECONNECT_MULTIPLIER` - Optional. Backoff multiplier. Default: 2
 * - `WS_KEEP_ALIVE` - Optional. Keep-alive ping interval (e.g., "30s")
 *
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * import { Effect, ConfigProvider, Layer } from 'effect'
 * import { WebSocketTransportConfigSchema } from 'voltaire-effect/services'
 *
 * const program = Effect.gen(function* () {
 *   const config = yield* WebSocketTransportConfigSchema
 *   console.log('URL:', config.url)
 *   console.log('Timeout:', Duration.toMillis(config.timeout))
 * }).pipe(
 *   Effect.provide(Layer.setConfigProvider(ConfigProvider.fromEnv()))
 * )
 * ```
 */
export const WebSocketTransportConfigSchema = Config.all({
	url: Config.string("url").pipe(
		Config.validate({
			message: "URL must start with ws:// or wss://",
			validation: (s) => s.startsWith("ws://") || s.startsWith("wss://"),
		}),
	),
	timeout: Config.duration("timeout").pipe(
		Config.withDefault(Duration.seconds(30)),
	),
	protocols: Config.string("protocols").pipe(Config.option),
	reconnectEnabled: Config.boolean("reconnectEnabled").pipe(
		Config.withDefault(false),
	),
	reconnect: ReconnectConfigSchema.pipe(Config.option),
	keepAlive: Config.duration("keepAlive").pipe(Config.option),
}).pipe(Config.nested("ws"));

/**
 * Type representing the resolved WebSocket transport configuration.
 *
 * @since 0.0.1
 */
export type WebSocketTransportConfigType = Config.Config.Success<
	typeof WebSocketTransportConfigSchema
>;

/**
 * Layer that creates a WebSocket transport from Effect.Config.
 *
 * @description
 * Reads configuration from the ConfigProvider (environment, files, etc.)
 * and creates a WebSocket transport layer.
 *
 * @since 0.0.1
 *
 * @example Environment variables
 * ```typescript
 * import { Effect, Layer, ConfigProvider } from 'effect'
 * import { WebSocketTransportFromConfig, TransportService, WebSocketConstructorGlobal } from 'voltaire-effect/services'
 *
 * // Set: WS_URL=wss://mainnet.infura.io/ws/v3/KEY
 *
 * const program = Effect.gen(function* () {
 *   const transport = yield* TransportService
 *   return yield* transport.request('eth_blockNumber')
 * }).pipe(
 *   Effect.provide(WebSocketTransportFromConfig),
 *   Effect.provide(WebSocketConstructorGlobal),
 *   Effect.provide(Layer.setConfigProvider(ConfigProvider.fromEnv())),
 *   Effect.scoped
 * )
 * ```
 *
 * @example Programmatic config
 * ```typescript
 * import { Effect, Layer, ConfigProvider } from 'effect'
 * import { WebSocketTransportFromConfig, TransportService, WebSocketConstructorGlobal } from 'voltaire-effect/services'
 *
 * const configProvider = ConfigProvider.fromMap(new Map([
 *   ['ws.url', 'wss://mainnet.infura.io/ws/v3/KEY'],
 *   ['ws.timeout', '60s'],
 *   ['ws.reconnectEnabled', 'true'],
 * ]))
 *
 * const program = Effect.gen(function* () {
 *   const transport = yield* TransportService
 *   return yield* transport.request('eth_blockNumber')
 * }).pipe(
 *   Effect.provide(WebSocketTransportFromConfig),
 *   Effect.provide(WebSocketConstructorGlobal),
 *   Effect.provide(Layer.setConfigProvider(configProvider)),
 *   Effect.scoped
 * )
 * ```
 */
export const WebSocketTransportFromConfig: Layer.Layer<
	TransportService,
	ConfigError.ConfigError | TransportError,
	Socket.WebSocketConstructor
> = Layer.unwrapScoped(
	Effect.gen(function* () {
		const config = yield* WebSocketTransportConfigSchema;

		// Build reconnect options if enabled
		const reconnect = config.reconnectEnabled
			? Option.match(config.reconnect, {
					onNone: () => true as const,
					onSome: (r) => ({
						maxAttempts: r.maxAttempts,
						delay: Duration.toMillis(r.delay),
						maxDelay: Duration.toMillis(r.maxDelay),
						multiplier: r.multiplier,
					}),
				})
			: false;

		// Build keep-alive if provided
		const keepAlive = Option.match(config.keepAlive, {
			onNone: () => undefined,
			onSome: (d) => Duration.toMillis(d),
		});

		// Build protocols if provided
		const protocols = Option.match(config.protocols, {
			onNone: () => undefined,
			onSome: (p) => p.split(",").map((s) => s.trim()),
		});

		return WebSocketTransport({
			url: config.url,
			timeout: Duration.toMillis(config.timeout),
			protocols,
			reconnect,
			keepAlive,
		});
	}),
);

/**
 * Creates a config-based WebSocket transport with global WebSocket constructor bundled.
 *
 * @description
 * Convenience layer that combines WebSocketTransportFromConfig with the global
 * WebSocket constructor, so you only need to provide the ConfigProvider.
 *
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * import { Effect, Layer, ConfigProvider } from 'effect'
 * import { WebSocketTransportFromConfigGlobal, TransportService } from 'voltaire-effect/services'
 *
 * const program = Effect.gen(function* () {
 *   const transport = yield* TransportService
 *   return yield* transport.request('eth_blockNumber')
 * }).pipe(
 *   Effect.provide(WebSocketTransportFromConfigGlobal),
 *   Effect.provide(Layer.setConfigProvider(ConfigProvider.fromEnv())),
 *   Effect.scoped
 * )
 * ```
 */
export const WebSocketTransportFromConfigGlobal: Layer.Layer<
	TransportService,
	ConfigError.ConfigError | TransportError
> = Layer.provide(WebSocketTransportFromConfig, WebSocketConstructorGlobal);
