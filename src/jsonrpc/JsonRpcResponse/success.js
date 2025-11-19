/**
 * Create success response
 *
 * @param {string | number | null} id - Request ID
 * @param {unknown} result - Result value
 * @returns {object} JSON-RPC success response
 *
 * @example
 * ```typescript
 * const res = JsonRpcResponse.success(1, "0x123456");
 * // { jsonrpc: "2.0", id: 1, result: "0x123456" }
 * ```
 */
export function success(id, result) {
	return {
		jsonrpc: "2.0",
		id,
		result,
	};
}
