/**
 * Convert JsonRpcError to string representation
 *
 * @param {{ code: number; message: string }} error - Error object
 * @returns {string} String representation
 *
 * @example
 * ```typescript
 * const err = JsonRpcError.from(-32601, "Method not found");
 * JsonRpcError.toString(err); // "[-32601] Method not found"
 * ```
 */
// biome-ignore lint/suspicious/noShadowRestrictedNames: Intentional API design for namespace consistency
export function toString(error) {
	return `[${error.code}] ${error.message}`;
}
