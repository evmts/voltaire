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
export {
	HttpTransport,
	HttpTransportFetch,
	type HttpTransportConfig,
} from "./HttpTransport.js";
export {
	HttpTransportConfigSchema,
	HttpTransportFromConfig,
	HttpTransportFromConfigFetch,
	type HttpTransportConfigType,
} from "./HttpTransportConfig.js";
export { TestTransport } from "./TestTransport.js";
export {
	TransportError,
	TransportService,
	type TransportShape,
} from "./TransportService.js";
export {
	WebSocketTransport,
	WebSocketConstructorGlobal,
	type ReconnectOptions,
} from "./WebSocketTransport.js";
export {
	WebSocketTransportConfigSchema,
	WebSocketTransportFromConfig,
	WebSocketTransportFromConfigGlobal,
	type WebSocketTransportConfigType,
} from "./WebSocketTransportConfig.js";

// New transport implementations
export { IpcTransport, type IpcTransportConfig } from "./IpcTransport.js";
export {
	CustomTransport,
	CustomTransportFromFn,
	type CustomTransportConfig,
	type EIP1193Provider,
} from "./CustomTransport.js";

// Interceptors and deduplication
export {
	onRequestRef,
	onResponseRef,
	onErrorRef,
	withRequestInterceptor,
	withResponseInterceptor,
	withErrorInterceptor,
	withInterceptors,
	InterceptedTransport,
	DeduplicatedTransport,
	type RpcRequest as InterceptorRpcRequest,
	type RpcResponse,
	type RpcError,
	type RequestInterceptor,
	type ResponseInterceptor,
	type ErrorInterceptor,
	type DeduplicationConfig,
} from "./TransportInterceptor.js";

// RPC request types and helpers
export {
	GetBlockNumber,
	GetChainId,
	GetGasPrice,
	GetBalance,
	GetTransactionCount,
	GetCode,
	GetStorageAt,
	Call,
	EstimateGas,
	GetBlockByNumber,
	GetBlockByHash,
	GetTransactionByHash,
	GetTransactionReceipt,
	GetLogs,
	SendRawTransaction,
	GetFeeHistory,
	GenericRpcRequest,
	toJsonRpc,
	type RpcRequest,
	type BlockTag,
	type CallParams,
	type LogFilter,
} from "./RpcRequest.js";
export { rpcRequest, rpc } from "./RpcResolver.js";

// Unified config
export {
	TransportConfig,
	TransportFromConfig,
	TransportFromConfigFetch,
	QuickConfig,
	ConfigProvider,
	type TransportConfigType,
} from "./TransportConfig.js";
