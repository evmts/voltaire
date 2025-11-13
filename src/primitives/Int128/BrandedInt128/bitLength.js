import { BITS, MODULO } from "./constants.js";

/**
 * Get bit length of Int128 value
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int128 documentation
 * @since 0.0.0
 * @param {import('./BrandedInt128.js').BrandedInt128} value - Input value
 * @returns {number} Number of bits needed to represent value
 * @example
 * ```javascript
 * import * as Int128 from './primitives/Int128/index.js';
 * const a = Int128.from(255n);
 * Int128.bitLength(a); // 8
 * ```
 */
export function bitLength(value) {
	if (value === 0n) return 0;

	// For negative numbers, use two's complement representation
	const unsigned = value < 0n ? value + MODULO : value;

	let len = 0;
	let temp = unsigned;
	while (temp > 0n) {
		len++;
		temp >>= 1n;
	}

	return len;
}
