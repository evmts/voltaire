/**
 * JSON-RPC 2.0 error object structure
 *
 * @property code - Error code (integer)
 * @property message - Error message (string)
 * @property data - Optional additional error data
 *
 * @see https://www.jsonrpc.org/specification#error_object
 */
export interface JsonRpcErrorType {
	readonly code: number;
	readonly message: string;
	readonly data?: unknown;
}
