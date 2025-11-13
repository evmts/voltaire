import { MAX, MIN, MODULO } from "./constants.js";

/**
 * Add Int256 values with wrapping (EVM ADD with signed interpretation)
 *
 * @see https://voltaire.tevm.sh/primitives/int256 for Int256 documentation
 * @since 0.0.0
 * @param {import('./BrandedInt256.js').BrandedInt256} a - First operand
 * @param {import('./BrandedInt256.js').BrandedInt256} b - Second operand
 * @returns {import('./BrandedInt256.js').BrandedInt256} Sum with wrapping
 * @example
 * ```javascript
 * import * as Int256 from './primitives/Int256/index.js';
 * const a = Int256.from(-100n);
 * const b = Int256.from(50n);
 * const sum = Int256.plus(a, b); // -50n
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
