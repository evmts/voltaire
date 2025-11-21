/**
 * Compare two JsonRpcId values for equality
 *
 * @param {string | number | null} id - First ID
 * @returns {boolean} True if IDs are equal
 *
 * @example
 * ```typescript
 * JsonRpcId.equals(1, 1); // true
 * JsonRpcId.equals("123", "123"); // true
 * JsonRpcId.equals(null, null); // true
 * JsonRpcId.equals(1, "1"); // false
 * ```
 */
export function equals(id) {
	return (other) => id === other;
}
