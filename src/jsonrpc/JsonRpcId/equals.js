/**
 * Compare two JsonRpcId values for equality
 *
 * @param {string | number | null} id - First ID
 * @returns {(other: string | number | null) => boolean} Function comparing with another ID
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
	return /** @param {string | number | null} other */ (other) => id === other;
}
