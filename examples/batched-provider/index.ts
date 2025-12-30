/**
 * Batched Provider Module
 *
 * JSON-RPC batch request provider for improved performance.
 * Batches multiple RPC calls into a single HTTP request.
 *
 * @module batched-provider
 *
 * @example
 * ```typescript
 * import { createBatchedProvider, wrapProvider } from './batched-provider';
 *
 * // Create with HTTP endpoint
 * const provider = createBatchedProvider('https://eth.llamarpc.com');
 *
 * // Or wrap existing provider
 * const batched = wrapProvider(window.ethereum);
 *
 * // Concurrent requests are batched automatically
 * const [blockNumber, balance] = await Promise.all([
 *   provider.request({ method: 'eth_blockNumber', params: [] }),
 *   provider.request({ method: 'eth_getBalance', params: ['0x...', 'latest'] })
 * ]);
 * ```
 */

// Main exports
export { createBatchedProvider, wrapProvider } from "./BatchedProvider.js";
export { createBatchScheduler } from "./BatchScheduler.js";

// Type exports
export type {
	// Core types
	BatchedProvider,
	BatchedProviderOptions,
	BatchOptions,
	BatchScheduler,

	// JSON-RPC types
	JsonRpcRequest,
	JsonRpcResponse,
	JsonRpcError,
	RequestArguments,

	// Provider types
	EIP1193Provider,
	HttpTransportOptions,

	// Internal types
	PendingRequest,
	BatchStats,
} from "./BatchedProviderTypes.js";

// Error exports
export {
	BatchedProviderError,
	RpcError,
	BatchTimeoutError,
	HttpError,
	MissingResponseError,
	ProviderDestroyedError,
	ConfigurationError,
	RpcErrorCodes,
	EIP1193ErrorCodes,
} from "./errors.js";
