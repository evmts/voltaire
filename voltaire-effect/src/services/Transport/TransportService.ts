/**
 * @fileoverview Transport service definition for JSON-RPC communication with Ethereum nodes.
 * This module defines the core transport abstraction used by all other services.
 *
 * @module TransportService
 * @since 0.0.1
 *
 * @description
 * The TransportService is the foundational service for all Ethereum JSON-RPC communication.
 * It provides a simple request/response interface that can be implemented by various
 * transport mechanisms (HTTP, WebSocket, browser provider, etc.).
 *
 * All other services (Provider, Signer, etc.) depend on TransportService
 * to communicate with Ethereum nodes.
 *
 * @see {@link HttpTransport} - HTTP transport implementation
 * @see {@link WebSocketTransport} - WebSocket transport implementation
 * @see {@link BrowserTransport} - Browser wallet transport implementation
 * @see {@link TestTransport} - Mock transport for testing
 */

import * as Context from "effect/Context";
import type * as Effect from "effect/Effect";
import { TransportError } from "./TransportError.js";

/**
 * Shape of a transport service for JSON-RPC communication.
 *
 * @description
 * Defines the contract for making RPC requests to Ethereum nodes.
 * All transport implementations must conform to this interface.
 *
 * @since 0.0.1
 */
export type TransportShape = {
	/**
	 * Sends a JSON-RPC request to the Ethereum node.
	 *
	 * @template T - The expected return type of the RPC call
	 * @param method - The JSON-RPC method name (e.g., 'eth_blockNumber', 'eth_call')
	 * @param params - Optional array of parameters for the method
	 * @returns Effect that resolves to the result of type T or fails with TransportError
	 *
	 * @throws {TransportError} When the request fails (network error, RPC error, timeout)
	 *
	 * @example
	 * ```typescript
	 * const program = Effect.gen(function* () {
	 *   const transport = yield* TransportService
	 *   // Get block number
	 *   const blockNumber = yield* transport.request<string>('eth_blockNumber')
	 *   // Get balance with parameters
	 *   const balance = yield* transport.request<string>('eth_getBalance', ['0x...', 'latest'])
	 *   return { blockNumber, balance }
	 * })
	 * ```
	 */
	readonly request: <T>(
		method: string,
		params?: unknown[],
	) => Effect.Effect<T, TransportError>;
};

/**
 * Transport service for JSON-RPC communication with Ethereum nodes.
 *
 * @description
 * Provides the foundation for all blockchain interactions. This is an Effect Context.Tag
 * that must be provided with a concrete implementation (HttpTransport, WebSocketTransport, etc.)
 * before running any program that depends on it.
 *
 * The service is used internally by ProviderService, SignerService, and other
 * higher-level services. Most users will not interact with TransportService directly,
 * but instead use the higher-level client services.
 *
 * @since 0.0.1
 *
 * @example Basic usage with HttpTransport
 * ```typescript
 * import { Effect, Layer } from 'effect'
 * import { TransportService, HttpTransport } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   const transport = yield* TransportService
 *   const blockNumber = yield* transport.request<string>('eth_blockNumber')
 *   return BigInt(blockNumber)
 * })
 *
 * // Provide the transport layer
 * const runnable = program.pipe(
 *   Effect.provide(HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY'))
 * )
 *
 * await Effect.runPromise(runnable)
 * ```
 *
 * @example Using with WebSocket for subscriptions
 * ```typescript
 * import { Effect } from 'effect'
 * import { TransportService, WebSocketTransport } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   const transport = yield* TransportService
 *   const subscriptionId = yield* transport.request<string>(
 *     'eth_subscribe',
 *     ['newHeads']
 *   )
 *   return subscriptionId
 * }).pipe(
 *   Effect.provide(WebSocketTransport('wss://mainnet.infura.io/ws/v3/YOUR_KEY')),
 *   Effect.scoped
 * )
 * ```
 *
 * @see {@link TransportShape} - The shape/interface of the transport service
 * @see {@link TransportError} - Error type thrown by transport operations
 * @see {@link RateLimitedTransport} - Optional rate-limited transport wrapper
 */
export class TransportService extends Context.Tag("TransportService")<
	TransportService,
	TransportShape
>() {}

export { TransportError };
