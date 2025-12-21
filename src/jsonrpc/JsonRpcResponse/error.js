/**
 * Create error response
 *
 * @param {string | number | null} id - Request ID
 * @param {import('../JsonRpcError/JsonRpcErrorType.js').JsonRpcErrorType} errorObj - Error object with code and message
 * @returns {import('./JsonRpcResponseType.js').JsonRpcErrorResponseType} JSON-RPC error response
 *
 * @example
 * ```typescript
 * const res = JsonRpcResponse.error(1, {
 *   code: -32601,
 *   message: "Method not found"
 * });
 * ```
 */
export function error(id, errorObj) {
	return /** @type {import('./JsonRpcResponseType.js').JsonRpcErrorResponseType} */ ({
		jsonrpc: "2.0",
		id,
		error: errorObj,
	});
}
