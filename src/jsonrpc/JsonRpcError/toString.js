/**
 * Convert JsonRpcError to string representation
 *
 * @param {object} error - Error object
 * @returns {string} String representation
 *
 * @example
 * ```typescript
 * const err = JsonRpcError.from(-32601, "Method not found");
 * JsonRpcError.toString(err); // "[-32601] Method not found"
 * ```
 */
export function toString(error) {
	return `[${error.code}] ${error.message}`;
}
