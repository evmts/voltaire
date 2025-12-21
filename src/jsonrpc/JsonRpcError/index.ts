// Export type definition
export type { JsonRpcErrorType } from "./JsonRpcErrorType.js";

// Export constants
export {
	PARSE_ERROR,
	INVALID_REQUEST,
	METHOD_NOT_FOUND,
	INVALID_PARAMS,
	INTERNAL_ERROR,
	INVALID_INPUT,
	RESOURCE_NOT_FOUND,
	RESOURCE_UNAVAILABLE,
	TRANSACTION_REJECTED,
	METHOD_NOT_SUPPORTED,
	LIMIT_EXCEEDED,
	JSON_RPC_VERSION_NOT_SUPPORTED,
	ERROR_MESSAGES,
} from "./constants.js";

// Import internal functions
import type { JsonRpcErrorType } from "./JsonRpcErrorType.js";
import { from } from "./from.js";
import { toString as _toString } from "./toString.js";

// Export constructors
export { from };

// Export public wrapper functions
export function toString(error: JsonRpcErrorType): string {
	return _toString(from(error));
}

// Export internal functions (tree-shakeable)
export { _toString };

// Export as namespace (convenience)
export const JsonRpcError = {
	from,
	toString,
	// Standard JSON-RPC 2.0 error codes
	PARSE_ERROR: -32700,
	INVALID_REQUEST: -32600,
	METHOD_NOT_FOUND: -32601,
	INVALID_PARAMS: -32602,
	INTERNAL_ERROR: -32603,
	// Ethereum-specific error codes (EIP-1474)
	INVALID_INPUT: -32000,
	RESOURCE_NOT_FOUND: -32001,
	RESOURCE_UNAVAILABLE: -32002,
	TRANSACTION_REJECTED: -32003,
	METHOD_NOT_SUPPORTED: -32004,
	LIMIT_EXCEEDED: -32005,
	JSON_RPC_VERSION_NOT_SUPPORTED: -32006,
};
