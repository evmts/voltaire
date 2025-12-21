import { MAX } from "./constants.js";

/**
 * Shift left operation
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @param {import('./Uint128Type.js').Uint128Type} uint - Value to shift
 * @param {number | bigint} bits - Number of bits to shift
 * @returns {import('./Uint128Type.js').Uint128Type} uint << bits (masked to 128 bits)
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint128 from './primitives/Uint128/index.js';
 * const a = Uint128.from(1n);
 * const result = Uint128.shiftLeft(a, 8); // 256n
 * ```
 */
export function shiftLeft(uint, bits) {
	const shift = typeof bits === "bigint" ? bits : BigInt(bits);
	if (shift >= 128n) {
		return /** @type {import('./Uint128Type.js').Uint128Type} */ (0n);
	}
	return /** @type {import('./Uint128Type.js').Uint128Type} */ ((uint << shift) & MAX);
}
