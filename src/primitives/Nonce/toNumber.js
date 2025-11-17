import * as Uint from "../Uint/index.js";

/**
 * Convert Nonce to number
 *
 * @param this - Nonce
 * @returns Number
 * @throws If nonce exceeds safe integer range
 *
 * @example
 * ```typescript
 * const n = Nonce._toNumber.call(nonce);
 * ```
 */
export function toNumber() {
	return Uint.toNumber(this);
}
