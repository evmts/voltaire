/**
 * Check if response is a success response
 *
 * @param {object} response - Response to check
 * @returns {boolean} True if success response
 *
 * @example
 * ```typescript
 * const res = JsonRpcResponse.from({ id: 1, result: "0x123" });
 * JsonRpcResponse.isSuccess(res); // true
 * ```
 */
export function isSuccess(response) {
	return "result" in response;
}
