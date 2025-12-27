import { SIZE } from "./constants.js";

/**
 * Create an independent copy of Bytes32
 *
 * @param {import('./Bytes32Type.js').Bytes32Type} bytes32 - Bytes32 to clone
 * @returns {import('./Bytes32Type.js').Bytes32Type} New Bytes32 with same values
 *
 * @example
 * ```typescript
 * const copy = Bytes32.clone(original);
 * // Modifying copy won't affect original
 * ```
 */
export function clone(bytes32) {
	const result = new Uint8Array(SIZE);
	result.set(bytes32);
	return /** @type {import('./Bytes32Type.js').Bytes32Type} */ (result);
}
