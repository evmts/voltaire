import type { JsonRpcRequestType } from "../JsonRpcRequest/JsonRpcRequestType.js";

/**
 * JSON-RPC 2.0 batch request
 * Array of JSON-RPC requests to be processed together
 *
 * Per spec, a batch request must be a non-empty array
 *
 * @see https://www.jsonrpc.org/specification#batch
 */
export type BatchRequestType = readonly JsonRpcRequestType[];
