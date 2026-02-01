import { compare } from "./compare.js";

/**
 * Return the maximum of two Bytes32 values (lexicographically)
 *
 * @param {import('./Bytes32Type.js').Bytes32Type} a - First Bytes32
 * @param {import('./Bytes32Type.js').Bytes32Type} b - Second Bytes32
 * @returns {import('./Bytes32Type.js').Bytes32Type} The larger value
 *
 * @example
 * ```typescript
 * const larger = Bytes32.max(a, b);
 * ```
 */
export function max(a, b) {
	return compare(a, b) >= 0 ? a : b;
}
