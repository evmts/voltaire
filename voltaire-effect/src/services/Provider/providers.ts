/**
 * @fileoverview Convenience provider factories that compose Transport + Provider into single layers.
 *
 * @module providers
 * @since 0.0.1
 *
 * @description
 * These are the idiomatic Effect way to use voltaire-effect. Instead of providing
 * both Provider and HttpTransport separately, just provide a single layer:
 *
 * ```typescript
 * // Before (two layers)
 * Effect.provide(Provider),
 * Effect.provide(HttpTransport('https://...'))
 *
 * // After (one layer - idiomatic)
 * Effect.provide(HttpProvider('https://...'))
 * ```
 */

import { FetchHttpClient } from "@effect/platform";
import type * as HttpClient from "@effect/platform/HttpClient";
import * as Layer from "effect/Layer";
import {
	HttpTransport,
	type HttpTransportConfig,
} from "../Transport/HttpTransport.js";
import {
	WebSocketTransport,
	type ReconnectOptions,
	WebSocketConstructorGlobal,
} from "../Transport/WebSocketTransport.js";
import { BrowserTransport } from "../Transport/BrowserTransport.js";
import {
	IpcTransport,
	type IpcTransportConfig,
} from "../Transport/IpcTransport.js";
import { TestTransport } from "../Transport/TestTransport.js";
import { ProviderService } from "./ProviderService.js";
import { Provider } from "./Provider.js";

/**
 * Creates an HTTP provider layer.
 *
 * @description
 * Composes HttpTransport + Provider into a single layer. This is the idiomatic
 * way to create a provider in Effect - one layer that provides ProviderService.
 *
 * @param options - URL string or HttpTransportConfig
 * @returns Layer providing ProviderService (requires HttpClient)
 *
 * @example
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const balance = yield* getBalance(address)
 *   return balance
 * }).pipe(
 *   Effect.provide(HttpProvider('https://eth.llamarpc.com'))
 * )
 * ```
 */
export const HttpProvider = (
	options: HttpTransportConfig | string,
): Layer.Layer<ProviderService, never, HttpClient.HttpClient> =>
	Provider.pipe(Layer.provide(HttpTransport(options)));

/**
 * Creates an HTTP provider layer with FetchHttpClient bundled.
 *
 * @description
 * Like HttpProvider but includes FetchHttpClient so there are no additional
 * requirements. This is the simplest way to get started.
 *
 * @param options - URL string or HttpTransportConfig
 * @returns Layer providing ProviderService with no requirements
 *
 * @example
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const balance = yield* getBalance(address)
 *   return balance
 * }).pipe(
 *   Effect.provide(HttpProviderFetch('https://eth.llamarpc.com'))
 * )
 * ```
 */
export const HttpProviderFetch = (
	options: HttpTransportConfig | string,
): Layer.Layer<ProviderService> =>
	HttpProvider(options).pipe(Layer.provide(FetchHttpClient.layer));

/**
 * WebSocket provider configuration options.
 */
export interface WebSocketProviderConfig {
	/** WebSocket endpoint URL (wss://) */
	url: string;
	/** Reconnection options */
	reconnect?: ReconnectOptions;
}

/**
 * Creates a WebSocket provider layer.
 *
 * @description
 * Composes WebSocketTransport + Provider into a single layer. Use this for
 * real-time subscriptions (eth_subscribe) or high-frequency requests.
 *
 * @param options - URL string or WebSocketProviderConfig
 * @returns Layer providing ProviderService (scoped, requires WebSocket)
 *
 * @example
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const subscriptionId = yield* subscribe('newHeads')
 *   return subscriptionId
 * }).pipe(
 *   Effect.provide(WebSocketProvider('wss://eth.llamarpc.com')),
 *   Effect.scoped
 * )
 * ```
 */
export const WebSocketProvider = (
	options: WebSocketProviderConfig | string,
): Layer.Layer<ProviderService, never, WebSocket> => {
	const config = typeof options === "string" ? { url: options } : options;
	return Provider.pipe(
		Layer.provide(WebSocketTransport(config.url, config.reconnect)),
	);
};

/**
 * Creates a WebSocket provider layer with global WebSocket.
 *
 * @description
 * Like WebSocketProvider but uses the global WebSocket constructor.
 * Works in browsers and Node.js 18+.
 *
 * @param options - URL string or WebSocketProviderConfig
 * @returns Layer providing ProviderService (scoped)
 */
export const WebSocketProviderGlobal = (
	options: WebSocketProviderConfig | string,
): Layer.Layer<ProviderService> =>
	WebSocketProvider(options).pipe(Layer.provide(WebSocketConstructorGlobal));

/**
 * Creates a browser wallet provider layer.
 *
 * @description
 * Composes BrowserTransport + Provider for use with window.ethereum.
 * Use this in browser environments with MetaMask, WalletConnect, etc.
 *
 * @returns Layer providing ProviderService
 *
 * @example
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const accounts = yield* getAccounts()
 *   return accounts
 * }).pipe(
 *   Effect.provide(BrowserProvider)
 * )
 * ```
 */
export const BrowserProvider: Layer.Layer<ProviderService> = Provider.pipe(
	Layer.provide(BrowserTransport),
);

/**
 * Creates an IPC provider layer.
 *
 * @description
 * Composes IpcTransport + Provider for Unix socket connections.
 * Use this for local node connections (geth, erigon, etc.).
 *
 * @param options - Socket path string or IpcTransportConfig
 * @returns Layer providing ProviderService
 *
 * @example
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const balance = yield* getBalance(address)
 *   return balance
 * }).pipe(
 *   Effect.provide(IpcProvider('/path/to/geth.ipc'))
 * )
 * ```
 */
export const IpcProvider = (
	options: IpcTransportConfig | string,
): Layer.Layer<ProviderService> =>
	Provider.pipe(Layer.provide(IpcTransport(options)));

/**
 * Creates a test/mock provider layer.
 *
 * @description
 * Composes TestTransport + Provider for testing. Provide mock responses
 * for specific RPC methods.
 *
 * @param mocks - Map of method names to mock response functions
 * @returns Layer providing ProviderService
 *
 * @example
 * ```typescript
 * const mockProvider = TestProvider({
 *   eth_blockNumber: () => '0x3039',  // 12345
 *   eth_getBalance: () => '0xde0b6b3a7640000'  // 1 ETH
 * })
 *
 * const program = Effect.gen(function* () {
 *   const balance = yield* getBalance(address)
 *   return balance
 * }).pipe(Effect.provide(mockProvider))
 * ```
 */
export const TestProvider = (
	mocks: Record<string, (...args: unknown[]) => unknown>,
): Layer.Layer<ProviderService> =>
	Provider.pipe(Layer.provide(TestTransport(mocks)));
