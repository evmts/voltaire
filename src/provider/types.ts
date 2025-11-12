/**
 * Provider Types
 *
 * Core types for the Provider interface including response handling,
 * request options, and event subscriptions.
 *
 * @module provider/types
 */

/**
 * JSON-RPC error response
 */
export interface RpcError {
	/** Error code (EIP-1193 or JSON-RPC 2.0) */
	code: number;
	/** Human-readable error message */
	message: string;
	/** Optional error data */
	data?: unknown;
}

/**
 * Response wrapper for provider methods
 * Contains either a result or an error, never both
 */
export type Response<T> =
	| { result: T; error?: never }
	| { result?: never; error: RpcError };

/**
 * Optional configuration for provider requests
 */
export interface RequestOptions {
	/** Request timeout in milliseconds */
	timeout?: number;
	/** Number of retry attempts on failure */
	retry?: number;
	/** Delay between retries in milliseconds */
	retryDelay?: number;
}

/**
 * Block tag for specifying block context
 */
export type BlockTag =
	| "latest"
	| "earliest"
	| "pending"
	| "safe"
	| "finalized"
	| string; // Also accepts hex-encoded block numbers

/**
 * Parameters for log event subscriptions
 */
export interface LogsParams {
	/** Filter by contract address(es) */
	address?: string | string[];
	/** Filter by topics */
	topics?: (string | string[] | null)[];
	/** Start block (default: latest) */
	fromBlock?: BlockTag;
	/** End block (default: latest) */
	toBlock?: BlockTag;
}

/**
 * Event subscription interface
 */
export interface ProviderEvents {
	/** Subscribe to new block headers */
	newHeads(): AsyncGenerator<any>;
	/** Subscribe to logs matching a filter */
	logs(params?: LogsParams): AsyncGenerator<any>;
	/** Subscribe to new pending transactions */
	newPendingTransactions(): AsyncGenerator<any>;
	/** Subscribe to sync status changes */
	syncing(): AsyncGenerator<any>;
}
