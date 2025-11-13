import { MODULO } from "./constants.js";

/**
 * Count set bits in Int128 two's complement representation
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int128 documentation
 * @since 0.0.0
 * @param {import('./BrandedInt128.js').BrandedInt128} value - Input value
 * @returns {number} Number of set bits
 * @example
 * ```javascript
 * import * as Int128 from './primitives/Int128/index.js';
 * const a = Int128.from(0x0fn);
 * Int128.popCount(a); // 4
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
