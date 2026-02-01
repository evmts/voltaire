/**
 * Standard JSON-RPC 2.0 error codes
 * @see https://www.jsonrpc.org/specification#error_object
 */

/** Parse error - Invalid JSON received by server */
export const PARSE_ERROR = -32700;

/** Invalid Request - JSON sent is not valid Request object */
export const INVALID_REQUEST = -32600;

/** Method not found - Method does not exist / is not available */
export const METHOD_NOT_FOUND = -32601;

/** Invalid params - Invalid method parameter(s) */
export const INVALID_PARAMS = -32602;

/** Internal error - Internal JSON-RPC error */
export const INTERNAL_ERROR = -32603;

/**
 * Ethereum-specific error codes (EIP-1474)
 * Server error range: -32000 to -32099
 * Reserved for implementation-defined server-errors
 * @see https://eips.ethereum.org/EIPS/eip-1474
 */

/** Invalid input - Missing or invalid parameters (commonly used for "execution reverted") */
export const INVALID_INPUT = -32000;

/** Resource not found - Requested resource not found (block, transaction, etc.) */
export const RESOURCE_NOT_FOUND = -32001;

/** Resource unavailable - Requested resource not available (node syncing, data not ready) */
export const RESOURCE_UNAVAILABLE = -32002;

/** Transaction rejected - Transaction creation failed */
export const TRANSACTION_REJECTED = -32003;

/** Method not supported - Method exists but is not implemented */
export const METHOD_NOT_SUPPORTED = -32004;

/** Request limit exceeded - Request exceeds defined limit */
export const LIMIT_EXCEEDED = -32005;

/** JSON-RPC version not supported - Version of JSON-RPC protocol is not supported */
export const JSON_RPC_VERSION_NOT_SUPPORTED = -32006;

/**
 * Error code messages
 */
export const ERROR_MESSAGES = {
	[PARSE_ERROR]: "Parse error",
	[INVALID_REQUEST]: "Invalid Request",
	[METHOD_NOT_FOUND]: "Method not found",
	[INVALID_PARAMS]: "Invalid params",
	[INTERNAL_ERROR]: "Internal error",
	[INVALID_INPUT]: "Invalid input",
	[RESOURCE_NOT_FOUND]: "Resource not found",
	[RESOURCE_UNAVAILABLE]: "Resource unavailable",
	[TRANSACTION_REJECTED]: "Transaction rejected",
	[METHOD_NOT_SUPPORTED]: "Method not supported",
	[LIMIT_EXCEEDED]: "Limit exceeded",
	[JSON_RPC_VERSION_NOT_SUPPORTED]: "JSON-RPC version not supported",
};
