/**
 * Provider Types
 *
 * EIP-1193 compliant provider types for Ethereum JSON-RPC communication.
 *
 * @module provider/types
 */

/**
 * EIP-1193 request arguments
 */
export interface RequestArguments {
	/** JSON-RPC method name */
	readonly method: string;
	/** Method parameters (array or object) */
	readonly params?: readonly unknown[] | object;
}

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
 * EIP-1193 error codes
 */
export enum ProviderRpcErrorCode {
	/** User rejected request */
	UserRejectedRequest = 4001,
	/** Requested method/account not authorized */
	Unauthorized = 4100,
	/** Provider doesn't support requested method */
	UnsupportedMethod = 4200,
	/** Provider disconnected from chains */
	Disconnected = 4900,
	/** Provider disconnected from all chains */
	ChainDisconnected = 4901,
}

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
 * EIP-1193 event listener
 */
export type ProviderEventListener = (...args: unknown[]) => void;

/**
 * EIP-1193 chain information for connect event
 */
export interface ProviderConnectInfo {
	/** Chain ID as hex string */
	chainId: string;
}

/**
 * EIP-1193 provider events
 */
export interface ProviderEventMap {
	/** Emitted when accounts change */
	accountsChanged: [accounts: string[]];
	/** Emitted when chain changes */
	chainChanged: [chainId: string];
	/** Emitted when provider connects */
	connect: [connectInfo: ProviderConnectInfo];
	/** Emitted when provider disconnects */
	disconnect: [error: RpcError];
	/** Emitted for custom messages */
	message: [message: { type: string; data: unknown }];
}

/**
 * Event names for EIP-1193 provider
 */
export type ProviderEvent = keyof ProviderEventMap;

/**
 * JSON-RPC response wrapper
 */
export interface Response<T> {
	/** Result data (undefined if error) */
	result?: T;
	/** Error data (undefined if success) */
	error?: RpcError;
}

/**
 * WebSocket native event subscriptions
 */
export interface ProviderEvents {
	/** Subscribe to new block headers */
	newHeads: () => AsyncGenerator<any, void, unknown>;
	/** Subscribe to log events */
	logs: (params?: any) => AsyncGenerator<any, void, unknown>;
	/** Subscribe to pending transactions */
	newPendingTransactions: () => AsyncGenerator<any, void, unknown>;
	/** Subscribe to sync status changes */
	syncing: () => AsyncGenerator<any, void, unknown>;
}
