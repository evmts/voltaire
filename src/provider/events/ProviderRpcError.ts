/**
 * Provider RPC Error
 *
 * Error class for EIP-1193 and JSON-RPC 2.0 errors.
 *
 * @module provider/events/ProviderRpcError
 */

/**
 * Provider RPC error
 *
 * Extends Error with numeric code and optional data.
 * Codes follow EIP-1193 and JSON-RPC 2.0 specifications.
 *
 * @example
 * ```typescript
 * // Standard EIP-1193 error
 * throw new ProviderRpcError(4001, 'User rejected request');
 *
 * // With additional data
 * throw new ProviderRpcError(
 *   4200,
 *   'Unsupported method',
 *   { method: 'eth_customMethod' }
 * );
 * ```
 */
export class ProviderRpcError extends Error {
	/** Numeric error code (EIP-1193 or JSON-RPC 2.0) */
	code: number;

	/** Optional error data */
	data?: unknown;

	constructor(code: number, message: string, data?: unknown) {
		super(message);
		this.name = "ProviderRpcError";
		this.code = code;
		this.data = data;
	}
}

/**
 * Standard EIP-1193 error codes
 */
export const EIP1193ErrorCode = {
	/** User rejected the request */
	UserRejectedRequest: 4001,
	/** Method/account not authorized */
	Unauthorized: 4100,
	/** Method not supported */
	UnsupportedMethod: 4200,
	/** Provider disconnected from all chains */
	Disconnected: 4900,
	/** Provider not connected to requested chain */
	ChainDisconnected: 4901,
} as const;

/**
 * JSON-RPC 2.0 error codes
 */
export const JsonRpcErrorCode = {
	/** Invalid JSON */
	ParseError: -32700,
	/** Invalid request object */
	InvalidRequest: -32600,
	/** Method not found */
	MethodNotFound: -32601,
	/** Invalid parameters */
	InvalidParams: -32602,
	/** Internal error */
	InternalError: -32603,
} as const;
