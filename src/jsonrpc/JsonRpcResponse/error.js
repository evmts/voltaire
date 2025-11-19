/**
 * Create error response
 *
 * @param {string | number | null} id - Request ID
 * @param {object} error - Error object with code and message
 * @returns {object} JSON-RPC error response
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
	return {
		jsonrpc: "2.0",
		id,
		error: errorObj,
	};
}
