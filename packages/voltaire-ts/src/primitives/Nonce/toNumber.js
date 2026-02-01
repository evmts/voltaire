import * as Uint from "../Uint/index.js";

/**
 * Convert Nonce to number
 *
 * @this {import('./NonceType.js').NonceType}
 * @returns {number} Number
 * @throws If nonce exceeds safe integer range
 *
 * @example
 * ```typescript
 * const n = Nonce._toNumber.call(nonce);
 * ```
 */
export function toNumber() {
	return Uint.toNumber(
		/** @type {import('../Uint/index.js').Type} */ (
			/** @type {unknown} */ (this)
		),
	);
}
