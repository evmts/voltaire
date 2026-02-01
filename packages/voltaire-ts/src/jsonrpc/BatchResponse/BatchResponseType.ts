import type { JsonRpcResponseType } from "../JsonRpcResponse/JsonRpcResponseType.js";

/**
 * JSON-RPC 2.0 batch response
 * Array of JSON-RPC responses corresponding to batch requests
 *
 * Per spec:
 * - Responses may be in any order
 * - Match responses to requests using id field
 * - Array may be smaller than request batch if some requests had no response
 *
 * @see https://www.jsonrpc.org/specification#batch
 */
export type BatchResponseType = readonly JsonRpcResponseType[];
