import { MODULO } from "./constants.js";

/**
 * Count set bits in Int256 two's complement representation
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int256 documentation
 * @since 0.0.0
 * @param {import('./BrandedInt256.js').BrandedInt256} value - Input value
 * @returns {number} Number of set bits
 * @example
 * ```javascript
 * import * as Int256 from './primitives/Int256/index.js';
 * const a = Int256.from(0x0fn);
 * Int256.popCount(a); // 4
 * ```
 */
export function popCount(value) {
	// For negative numbers, use two's complement representation
	const unsigned = value < 0n ? value + MODULO : value;

	let count = 0;
	let temp = unsigned;

	while (temp > 0n) {
		count += Number(temp & 1n);
		temp >>= 1n;
	}

	return count;
}
