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
 * - {@link RateLimitedTransport} - Rate-limited transport wrapper
 *
 * @example Typical usage pattern
 * ```typescript
 * import { Effect } from 'effect'
 * import {
 *   HttpTransport,
 *   Provider,
 *   getBlockNumber
 * } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   const blockNumber = yield* getBlockNumber()
 *   return blockNumber
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY'))
 * )
 * ```
 *
 * @see {@link TransportService} - Core service interface
 * @see {@link TransportError} - Error type for transport failures
 */

export type { BatchOptions } from "./BatchScheduler.js";
export { BrowserTransport } from "./BrowserTransport.js";
export {
	CustomTransport,
	type CustomTransportConfig,
	CustomTransportFromFn,
	type EIP1193Provider,
} from "./CustomTransport.js";
// FiberRef-scoped transport config overrides
export {
	cacheEnabledRef,
	retryScheduleRef,
	timeoutRef,
	tracingRef,
	withoutCache,
	withRetrySchedule,
	withTimeout,
	withTracing,
} from "./config.js";
export {
	FallbackTransport,
	type FallbackTransportOptions,
} from "./FallbackTransport.js";
export {
	HttpTransport,
	type HttpTransportConfig,
	HttpTransportFetch,
} from "./HttpTransport.js";
export {
	HttpTransportConfigSchema,
	type HttpTransportConfigType,
	HttpTransportFromConfig,
	HttpTransportFromConfigFetch,
} from "./HttpTransportConfig.js";
export {
	IdGenerator,
	IdGeneratorLive,
	type IdGeneratorShape,
	makeIdGenerator,
	nextId,
} from "./IdGenerator.js";
// New transport implementations
export {
	type IpcReconnectOptions,
	IpcTransport,
	type IpcTransportConfig,
} from "./IpcTransport.js";
export { RateLimitedTransport } from "./RateLimitedTransport.js";
// RPC request types and helpers
export {
	type BlockTag,
	Call,
	type CallParams,
	EstimateGas,
	GenericRpcRequest,
	GetBalance,
	GetBlockByHash,
	GetBlockByNumber,
	GetBlockNumber,
	GetChainId,
	GetCode,
	GetFeeHistory,
	GetGasPrice,
	GetLogs,
	GetStorageAt,
	GetTransactionByHash,
	GetTransactionCount,
	GetTransactionReceipt,
	type LogFilter,
	type RpcRequest,
	SendRawTransaction,
	toJsonRpc,
} from "./RpcRequest.js";
export { rpc, rpcRequest } from "./RpcResolver.js";
export { TestTransport } from "./TestTransport.js";
// Unified config
export {
	ConfigProvider,
	QuickConfig,
	TransportConfig,
	type TransportConfigType,
	TransportFromConfig,
	TransportFromConfigFetch,
} from "./TransportConfig.js";

// Interceptors and deduplication
export {
	DeduplicatedTransport,
	type DeduplicationConfig,
	type ErrorInterceptor,
	InterceptedTransport,
	onErrorRef,
	onRequestRef,
	onResponseRef,
	type RequestInterceptor,
	type ResponseInterceptor,
	type RpcError,
	type RpcRequest as InterceptorRpcRequest,
	type RpcResponse,
	withErrorInterceptor,
	withInterceptors,
	withRequestInterceptor,
	withResponseInterceptor,
} from "./TransportInterceptor.js";
export {
	TransportError,
	TransportService,
	type TransportShape,
} from "./TransportService.js";
export {
	type ReconnectOptions,
	WebSocketConstructorGlobal,
	WebSocketTransport,
} from "./WebSocketTransport.js";
export {
	WebSocketTransportConfigSchema,
	type WebSocketTransportConfigType,
	WebSocketTransportFromConfig,
	WebSocketTransportFromConfigGlobal,
} from "./WebSocketTransportConfig.js";
