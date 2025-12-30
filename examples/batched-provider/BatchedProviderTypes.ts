/**
 * Batched Provider Type Definitions
 *
 * TypeScript types for the batched provider abstraction.
 *
 * @module batched-provider/BatchedProviderTypes
 */

import type { Hex } from "../../src/primitives/Hex/index.js";

/**
 * EIP-1193 request arguments
 */
export interface RequestArguments {
	/** JSON-RPC method name */
	readonly method: string;
	/** Method parameters */
	readonly params?: readonly unknown[] | Record<string, unknown>;
}

/**
 * JSON-RPC request structure
 */
export interface JsonRpcRequest {
	/** JSON-RPC version */
	jsonrpc: "2.0";
	/** Unique request identifier */
	id: number;
	/** RPC method name */
	method: string;
	/** Method parameters */
	params: readonly unknown[];
}

/**
 * JSON-RPC error structure
 */
export interface JsonRpcError {
	/** Error code */
	code: number;
	/** Human-readable message */
	message: string;
	/** Optional error data */
	data?: unknown;
}

/**
 * JSON-RPC response structure
 */
export interface JsonRpcResponse<T = unknown> {
	/** JSON-RPC version */
	jsonrpc: "2.0";
	/** Request identifier (matches request) */
	id: number;
	/** Success result (mutually exclusive with error) */
	result?: T;
	/** Error data (mutually exclusive with result) */
	error?: JsonRpcError;
}

/**
 * EIP-1193 provider interface (minimal)
 */
export interface EIP1193Provider {
	/** Submit JSON-RPC request */
	request(args: RequestArguments): Promise<unknown>;
}

/**
 * HTTP transport options
 */
export interface HttpTransportOptions {
	/** JSON-RPC endpoint URL */
	url: string;
	/** Optional HTTP headers */
	headers?: Record<string, string>;
	/** Request timeout in milliseconds */
	timeout?: number;
	/** Custom fetch function */
	fetchFn?: typeof fetch;
}

/**
 * Batch configuration options
 */
export interface BatchOptions {
	/**
	 * Debounce window in milliseconds.
	 * Requests are accumulated during this window before being sent as a batch.
	 * @default 10
	 */
	wait?: number;

	/**
	 * Maximum number of requests per batch.
	 * If exceeded, batch is split into multiple HTTP requests.
	 * @default 100
	 */
	maxBatchSize?: number;

	/**
	 * HTTP request timeout in milliseconds.
	 * @default 30000
	 */
	timeout?: number;
}

/**
 * Full batched provider configuration
 */
export interface BatchedProviderOptions extends BatchOptions {
	/** HTTP transport configuration */
	http?: HttpTransportOptions;

	/** Underlying EIP-1193 provider (alternative to http) */
	provider?: EIP1193Provider;
}

/**
 * Pending request tracking
 */
export interface PendingRequest {
	/** Unique request ID */
	id: number;
	/** Original request */
	request: RequestArguments;
	/** Promise resolve function */
	resolve: (value: unknown) => void;
	/** Promise reject function */
	reject: (error: Error) => void;
}

/**
 * Batch scheduler interface
 */
export interface BatchScheduler {
	/**
	 * Schedule a request for batching
	 * @param request - JSON-RPC request
	 * @returns Promise resolving to the result
	 */
	schedule(request: RequestArguments): Promise<unknown>;

	/**
	 * Force immediate execution of pending requests
	 */
	flush(): Promise<void>;

	/**
	 * Get count of pending requests
	 */
	getPendingCount(): number;
}

/**
 * Batched provider interface (extends EIP-1193)
 */
export interface BatchedProvider extends EIP1193Provider {
	/**
	 * Force flush pending batch immediately
	 */
	flush(): Promise<void>;

	/**
	 * Get count of requests waiting to be sent
	 */
	getPendingCount(): number;

	/**
	 * Destroy provider and reject pending requests
	 */
	destroy(): void;
}

/**
 * Batch execution statistics
 */
export interface BatchStats {
	/** Total requests batched */
	totalRequests: number;
	/** Total batches sent */
	totalBatches: number;
	/** Average batch size */
	avgBatchSize: number;
	/** Total errors */
	errors: number;
}
