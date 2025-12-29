/**
 * Convert JsonRpcId to string representation
 *
 * @param {string | number | null} id - ID to convert
 * @returns {string} String representation
 *
 * @example
 * ```typescript
 * JsonRpcId.toString(1); // "1"
 * JsonRpcId.toString("abc"); // "abc"
 * JsonRpcId.toString(null); // "null"
 * ```
 */
// biome-ignore lint/suspicious/noShadowRestrictedNames: Intentional API design for namespace consistency
export function toString(id) {
	if (id === null) return "null";
	return String(id);
}
