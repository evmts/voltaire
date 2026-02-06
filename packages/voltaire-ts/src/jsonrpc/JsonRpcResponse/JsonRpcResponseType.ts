import type { JsonRpcErrorType } from "../JsonRpcError/JsonRpcErrorType.js";
import type { JsonRpcIdType } from "../JsonRpcId/JsonRpcIdType.js";
import type { JsonRpcVersionType } from "../JsonRpcVersion/JsonRpcVersionType.js";

/**
 * JSON-RPC 2.0 success response
 *
 * @template TResult - Type of result value
 * @property jsonrpc - JSON-RPC version (always "2.0")
 * @property id - Request identifier for correlation
 * @property result - Success result value
 *
 * @see https://www.jsonrpc.org/specification#response_object
 */
export interface JsonRpcSuccessResponseType<TResult = unknown> {
	readonly jsonrpc: JsonRpcVersionType;
	readonly id: JsonRpcIdType;
	readonly result: TResult;
}

/**
 * JSON-RPC 2.0 error response
 *
 * @property jsonrpc - JSON-RPC version (always "2.0")
 * @property id - Request identifier for correlation
 * @property error - Error object
 *
 * @see https://www.jsonrpc.org/specification#response_object
 */
export interface JsonRpcErrorResponseType {
	readonly jsonrpc: JsonRpcVersionType;
	readonly id: JsonRpcIdType;
	readonly error: JsonRpcErrorType;
}

/**
 * JSON-RPC 2.0 response (success or error)
 *
 * @template TResult - Type of result value for success responses
 *
 * @see https://www.jsonrpc.org/specification#response_object
 */
export type JsonRpcResponseType<TResult = unknown> =
	| JsonRpcSuccessResponseType<TResult>
	| JsonRpcErrorResponseType;
