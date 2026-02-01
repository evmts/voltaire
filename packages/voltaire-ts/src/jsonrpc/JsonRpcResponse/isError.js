/**
 * Check if response is an error response
 *
 * @param {object} response - Response to check
 * @returns {boolean} True if error response
 *
 * @example
 * ```typescript
 * const res = JsonRpcResponse.from({
 *   id: 1,
 *   error: { code: -32601, message: "Method not found" }
 * });
 * JsonRpcResponse.isError(res); // true
 * ```
 */
export function isError(response) {
	return "error" in response;
}
