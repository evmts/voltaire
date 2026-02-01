/**
 * Create success response
 *
 * @template TResult
 * @param {string | number | null} id - Request ID
 * @param {TResult} result - Result value
 * @returns {import('./JsonRpcResponseType.js').JsonRpcSuccessResponseType<TResult>} JSON-RPC success response
 *
 * @example
 * ```typescript
 * const res = JsonRpcResponse.success(1, "0x123456");
 * // { jsonrpc: "2.0", id: 1, result: "0x123456" }
 * ```
 */
export function success(id, result) {
	return /** @type {import('./JsonRpcResponseType.js').JsonRpcSuccessResponseType<TResult>} */ ({
		jsonrpc: "2.0",
		id,
		result,
	});
}
