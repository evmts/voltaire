/**
 * Unwrap response result or throw error
 *
 * @param {import('./JsonRpcResponseType.js').JsonRpcResponseType} response - Response to unwrap
 * @returns {unknown} Result value if success
 * @throws {Error} If response is error
 *
 * @example
 * ```typescript
 * const successRes = JsonRpcResponse.from({ id: 1, result: "0x123" });
 * const result = JsonRpcResponse.unwrap(successRes); // "0x123"
 *
 * const errorRes = JsonRpcResponse.from({
 *   id: 2,
 *   error: { code: -32601, message: "Method not found" }
 * });
 * JsonRpcResponse.unwrap(errorRes); // throws Error
 * ```
 */
export function unwrap(response) {
	if ("result" in response) {
		return response.result;
	}

	/** @type {*} */
	const typedResponse = response;
	/** @type {*} */
	const err = new Error(typedResponse.error.message);
	err.code = typedResponse.error.code;
	if (typedResponse.error.data !== undefined) {
		err.data = typedResponse.error.data;
	}
	throw err;
}
