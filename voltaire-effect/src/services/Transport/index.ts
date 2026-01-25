/**
 * @fileoverview Transport module exports for JSON-RPC communication.
 *
 * @module Transport
 * @since 0.0.1
 *
 * @description
 * This module provides the transport layer for communicating with Ethereum
 * JSON-RPC endpoints. It exports the core TransportService and multiple
 * implementations for different use cases:
 *
 * - {@link TransportService} - The core service tag/interface
 * - {@link HttpTransport} - HTTP-based transport for standard RPC calls
 * - {@link WebSocketTransport} - WebSocket transport for subscriptions
 * - {@link BrowserTransport} - Browser wallet (window.ethereum) transport
 * - {@link TestTransport} - Mock transport for testing
 *
 * @example Typical usage pattern
 * ```typescript
 * import { Effect } from 'effect'
 * import {
 *   TransportService,
 *   HttpTransport,
 *   Provider,
 *   ProviderService
 * } from 'voltaire-effect/services'
 *
 * const program = Effect.gen(function* () {
 *   const client = yield* ProviderService
 *   return yield* client.getBlockNumber()
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY'))
 * )
 * ```
 *
 * @see {@link TransportService} - Core service interface
 * @see {@link TransportError} - Error type for transport failures
 */

export { type BatchOptions } from "./BatchScheduler.js";
export { BrowserTransport } from "./BrowserTransport.js";
export {
	FallbackTransport,
	type FallbackTransportOptions,
} from "./FallbackTransport.js";
export { HttpTransport } from "./HttpTransport.js";
export { TestTransport } from "./TestTransport.js";
export {
	TransportError,
	TransportService,
	type TransportShape,
} from "./TransportService.js";
export {
	WebSocketTransport,
	type ReconnectOptions,
} from "./WebSocketTransport.js";
