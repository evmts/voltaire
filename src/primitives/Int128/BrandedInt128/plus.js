import { MAX, MIN, MODULO } from "./constants.js";

/**
 * Add Int128 values with wrapping
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int128 documentation
 * @since 0.0.0
 * @param {import('./BrandedInt128.js').BrandedInt128} a - First operand
 * @param {import('./BrandedInt128.js').BrandedInt128} b - Second operand
 * @returns {import('./BrandedInt128.js').BrandedInt128} Sum with wrapping
 * @example
 * ```javascript
 * import * as Int128 from './primitives/Int128/index.js';
 * const a = Int128.from(-100n);
 * const b = Int128.from(50n);
 * const sum = Int128.plus(a, b); // -50n
 * ```
 */
export function plus(a, b) {
	const sum = a + b;

	// Handle wrapping
	if (sum > MAX) {
		return sum - MODULO;
	}
	if (sum < MIN) {
		return sum + MODULO;
	}

	return sum;
}
