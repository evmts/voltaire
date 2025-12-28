/**
 * Legacy compatibility layer for JsonRpcRequest
 * @deprecated Import from JsonRpcRequest module directly
 */
import { from } from "./JsonRpcRequest/from.js";

/**
 * @template TParams
 * @typedef {import('./JsonRpcRequest/JsonRpcRequestType.js').JsonRpcRequestType<TParams>} JsonRpcRequest
 */

/**
 * Create JSON-RPC request
 * @param {string} method
 * @param {unknown} [params]
 * @param {string | number | null} [id]
 * @returns {import('./JsonRpcRequest/JsonRpcRequestType.js').JsonRpcRequestType}
 */
export function createRequest(method, params, id) {
	const request = from({
		id: id ?? null,
		method,
		...(params !== undefined && { params: /** @type {unknown[]} */ (params) }),
	});
	return /** @type {import('./JsonRpcRequest/JsonRpcRequestType.js').JsonRpcRequestType} */ (request);
}
