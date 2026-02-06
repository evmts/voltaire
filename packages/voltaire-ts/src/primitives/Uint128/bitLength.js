/**
 * Get bit length of value
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @param {import('./Uint128Type.js').Uint128Type} uint - Value to measure
 * @returns {number} Number of bits required (0-128)
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint128 from './primitives/Uint128/index.js';
 * const a = Uint128.from(255n);
 * Uint128.bitLength(a); // 8
 * ```
 */
export function bitLength(uint) {
	if (uint === 0n) {
		return 0;
	}

	let bits = 0;
	let val = /** @type {bigint} */ (uint);
	while (val > 0n) {
		bits++;
		val = val >> 1n;
	}
	return bits;
}
