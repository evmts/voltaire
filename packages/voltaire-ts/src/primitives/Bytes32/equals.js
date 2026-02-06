import { SIZE } from "./constants.js";

/**
 * Check if two Bytes32 values are equal
 *
 * @param {import('./Bytes32Type.js').Bytes32Type} a - First Bytes32
 * @param {import('./Bytes32Type.js').Bytes32Type} b - Second Bytes32
 * @returns {boolean} True if equal
 *
 * @example
 * ```typescript
 * if (Bytes32.equals(a, b)) {
 *   console.log("Values match");
 * }
 * ```
 */
export function equals(a, b) {
	if (a.length !== SIZE || b.length !== SIZE) return false;
	for (let i = 0; i < SIZE; i++) {
		if (a[i] !== b[i]) return false;
	}
	return true;
}
