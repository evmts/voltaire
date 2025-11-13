import { BITS, MODULO } from "./constants.js";

/**
 * Count leading zeros in Int256 two's complement representation
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int256 documentation
 * @since 0.0.0
 * @param {import('./BrandedInt256.js').BrandedInt256} value - Input value
 * @returns {number} Number of leading zero bits
 * @example
 * ```javascript
 * import * as Int256 from './primitives/Int256/index.js';
 * const a = Int256.from(1n);
 * Int256.leadingZeros(a); // 127
 * ```
 */
export function leadingZeros(value) {
	if (value === 0n) return BITS;

	// For negative numbers, use two's complement representation
	const unsigned = value < 0n ? value + MODULO : value;

	let count = BITS;
	let temp = unsigned;

	while (temp > 0n) {
		count--;
		temp >>= 1n;
	}

	return count;
}
