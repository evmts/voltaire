import { Hash } from "../Hash/index.js";

/**
 * @typedef {import('./StateRootType.js').StateRootType} StateRootType
 */

/**
 * Converts a StateRoot to a hex string.
 *
 * @param {StateRootType} stateRoot - The StateRoot to convert
 * @returns {string} - Hex string with 0x prefix
 *
 * @example
 * ```typescript
 * const hex = StateRoot.toHex(root);
 * // "0x1234..."
 * ```
 */
export function toHex(stateRoot) {
	return Hash.toHex(
		/** @type {import('../Hash/HashType.js').HashType} */ (
			/** @type {unknown} */ (stateRoot)
		),
	);
}
