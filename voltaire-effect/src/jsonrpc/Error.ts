export type JsonRpcErrorType = {
	readonly code: number;
	readonly message: string;
	readonly data?: unknown;
};

export function from(input: {
	code: number;
	message: string;
	data?: unknown;
}): JsonRpcErrorType {
	return {
		code: input.code,
		message: input.message,
		data: input.data,
	};
}

// biome-ignore lint/suspicious/noShadowRestrictedNames: Intentional API design
export function toString(error: JsonRpcErrorType): string {
	return `JsonRpcError [${error.code}]: ${error.message}${error.data ? ` (data: ${JSON.stringify(error.data)})` : ""}`;
}

// Standard JSON-RPC error codes
export const PARSE_ERROR = -32700;
export const INVALID_REQUEST = -32600;
export const METHOD_NOT_FOUND = -32601;
export const INVALID_PARAMS = -32602;
export const INTERNAL_ERROR = -32603;

// EIP-1474 Ethereum error codes
export const INVALID_INPUT = -32000;
export const RESOURCE_NOT_FOUND = -32001;
export const RESOURCE_UNAVAILABLE = -32002;
export const TRANSACTION_REJECTED = -32003;
export const METHOD_NOT_SUPPORTED = -32004;
export const LIMIT_EXCEEDED = -32005;
export const JSON_RPC_VERSION_NOT_SUPPORTED = -32006;

// EIP-1193 Provider error codes
export const USER_REJECTED_REQUEST = 4001;
export const UNAUTHORIZED = 4100;
export const UNSUPPORTED_METHOD = 4200;
export const DISCONNECTED = 4900;
export const CHAIN_DISCONNECTED = 4901;

// Common node-specific error codes
export const EXECUTION_REVERTED = 3;

// Helper functions
export const isUserRejected = (code: number): boolean =>
	code === USER_REJECTED_REQUEST;

export const isDisconnected = (code: number): boolean =>
	code === DISCONNECTED || code === CHAIN_DISCONNECTED;

export const isProviderError = (code: number): boolean =>
	code >= 4000 && code <= 4999;

export const JsonRpcError = {
	from,
	toString,
	// Standard JSON-RPC
	PARSE_ERROR,
	INVALID_REQUEST,
	METHOD_NOT_FOUND,
	INVALID_PARAMS,
	INTERNAL_ERROR,
	// EIP-1474 Ethereum
	INVALID_INPUT,
	RESOURCE_NOT_FOUND,
	RESOURCE_UNAVAILABLE,
	TRANSACTION_REJECTED,
	METHOD_NOT_SUPPORTED,
	LIMIT_EXCEEDED,
	JSON_RPC_VERSION_NOT_SUPPORTED,
	// EIP-1193 Provider
	USER_REJECTED_REQUEST,
	UNAUTHORIZED,
	UNSUPPORTED_METHOD,
	DISCONNECTED,
	CHAIN_DISCONNECTED,
	// Common node-specific
	EXECUTION_REVERTED,
	// Helpers
	isUserRejected,
	isDisconnected,
	isProviderError,
};
