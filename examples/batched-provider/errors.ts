/**
 * Batched Provider Error Classes
 *
 * Custom error types for batched provider operations.
 *
 * @module batched-provider/errors
 */

/**
 * Base error class for batched provider errors
 */
export class BatchedProviderError extends Error {
	override name = "BatchedProviderError";

	constructor(message: string) {
		super(message);
		// Maintains proper stack trace in V8
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.constructor);
		}
	}
}

/**
 * Error thrown when a JSON-RPC request fails
 */
export class RpcError extends BatchedProviderError {
	override name = "RpcError";

	/** JSON-RPC error code */
	code: number;

	/** Additional error data from the RPC response */
	data?: unknown;

	/** The method that failed */
	method?: string;

	constructor(message: string, code: number, data?: unknown, method?: string) {
		super(message);
		this.code = code;
		this.data = data;
		this.method = method;
	}

	/**
	 * Create from JSON-RPC error response
	 */
	static fromResponse(
		error: { code: number; message: string; data?: unknown },
		method?: string,
	): RpcError {
		return new RpcError(error.message, error.code, error.data, method);
	}
}

/**
 * Error thrown when a batch request times out
 */
export class BatchTimeoutError extends BatchedProviderError {
	override name = "BatchTimeoutError";

	/** Timeout duration in milliseconds */
	timeout: number;

	/** Number of requests that were pending */
	pendingCount: number;

	constructor(timeout: number, pendingCount: number) {
		super(
			`Batch request timed out after ${timeout}ms with ${pendingCount} pending requests`,
		);
		this.timeout = timeout;
		this.pendingCount = pendingCount;
	}
}

/**
 * Error thrown when HTTP request fails
 */
export class HttpError extends BatchedProviderError {
	override name = "HttpError";

	/** HTTP status code */
	status: number;

	/** HTTP status text */
	statusText: string;

	/** Response body (if available) */
	body?: string;

	constructor(status: number, statusText: string, body?: string) {
		super(`HTTP ${status}: ${statusText}`);
		this.status = status;
		this.statusText = statusText;
		this.body = body;
	}
}

/**
 * Error thrown when response is missing for a request
 */
export class MissingResponseError extends BatchedProviderError {
	override name = "MissingResponseError";

	/** Request ID that was missing from response */
	requestId: number;

	/** Method of the missing request */
	method: string;

	constructor(requestId: number, method: string) {
		super(`Missing response for request id ${requestId} (method: ${method})`);
		this.requestId = requestId;
		this.method = method;
	}
}

/**
 * Error thrown when provider is destroyed but requests are pending
 */
export class ProviderDestroyedError extends BatchedProviderError {
	override name = "ProviderDestroyedError";

	constructor() {
		super("Provider has been destroyed");
	}
}

/**
 * Error thrown when configuration is invalid
 */
export class ConfigurationError extends BatchedProviderError {
	override name = "ConfigurationError";

	/** The invalid configuration key */
	key: string;

	/** The invalid value */
	value: unknown;

	constructor(key: string, value: unknown, message: string) {
		super(`Invalid configuration for '${key}': ${message}`);
		this.key = key;
		this.value = value;
	}
}

/**
 * Standard JSON-RPC error codes
 */
export const RpcErrorCodes = {
	/** Parse error - Invalid JSON */
	PARSE_ERROR: -32700,
	/** Invalid request - JSON is not a valid request object */
	INVALID_REQUEST: -32600,
	/** Method not found */
	METHOD_NOT_FOUND: -32601,
	/** Invalid params */
	INVALID_PARAMS: -32602,
	/** Internal error */
	INTERNAL_ERROR: -32603,
	/** Server error (reserved range: -32000 to -32099) */
	SERVER_ERROR: -32000,
} as const;

/**
 * EIP-1193 error codes
 */
export const EIP1193ErrorCodes = {
	/** User rejected request */
	USER_REJECTED: 4001,
	/** Unauthorized */
	UNAUTHORIZED: 4100,
	/** Unsupported method */
	UNSUPPORTED_METHOD: 4200,
	/** Disconnected */
	DISCONNECTED: 4900,
	/** Chain disconnected */
	CHAIN_DISCONNECTED: 4901,
} as const;
