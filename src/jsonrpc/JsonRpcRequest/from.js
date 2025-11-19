/**
 * Create JsonRpcRequest from request object or components
 *
 * @param {object} request - Request object with id, method, and optional params
 * @returns {object} JSON-RPC request object
 * @throws {TypeError} If required fields are missing or invalid
 *
 * @example
 * ```typescript
 * import { JsonRpcRequest } from './jsonrpc/JsonRpcRequest/index.js';
 *
 * // Simple request
 * const req1 = JsonRpcRequest.from({
 *   id: 1,
 *   method: "eth_blockNumber"
 * });
 *
 * // Request with params
 * const req2 = JsonRpcRequest.from({
 *   id: "abc-123",
 *   method: "eth_getBalance",
 *   params: ["0x123...", "latest"]
 * });
 * ```
 */
export function from(request) {
	if (!request || typeof request !== "object") {
		throw new TypeError("Request must be an object");
	}

	// Validate id
	const { id, method, params } = request;

	if (
		typeof id !== "string" &&
		typeof id !== "number" &&
		id !== null &&
		id !== undefined
	) {
		throw new TypeError("Request id must be string, number, or null");
	}

	// Validate method
	if (typeof method !== "string") {
		throw new TypeError("Request method must be a string");
	}

	const result = {
		jsonrpc: "2.0",
		id: id ?? null,
		method,
	};

	if (params !== undefined) {
		result.params = params;
	}

	return result;
}
