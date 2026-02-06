import type { JsonRpcIdType } from "../JsonRpcId/JsonRpcIdType.js";
import type { JsonRpcVersionType } from "../JsonRpcVersion/JsonRpcVersionType.js";

/**
 * JSON-RPC 2.0 request object
 *
 * @template TParams - Type of request parameters
 * @property jsonrpc - JSON-RPC version (always "2.0")
 * @property id - Request identifier for correlation
 * @property method - Method name to invoke
 * @property params - Optional method parameters
 *
 * @see https://www.jsonrpc.org/specification#request_object
 */
export interface JsonRpcRequestType<TParams = unknown> {
	readonly jsonrpc: JsonRpcVersionType;
	readonly id: JsonRpcIdType;
	readonly method: string;
	readonly params?: TParams;
}
