import { MAX, MIN, MODULO } from "./constants.js";

/**
 * Multiply Int128 values with wrapping
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int128 documentation
 * @since 0.0.0
 * @param {import('./BrandedInt128.js').BrandedInt128} a - First operand
 * @param {import('./BrandedInt128.js').BrandedInt128} b - Second operand
 * @returns {import('./BrandedInt128.js').BrandedInt128} Product with wrapping
 * @example
 * ```javascript
 * import * as Int128 from './primitives/Int128/index.js';
 * const a = Int128.from(10n);
 * const b = Int128.from(-5n);
 * const product = Int128.times(a, b); // -50n
 * ```
 */
export function times(a, b) {
	const product = a * b;

	// Normalize to range using modulo arithmetic
	let result = product % MODULO;

	// Adjust to signed range
	if (result > MAX) {
		result -= MODULO;
	} else if (result < MIN) {
		result += MODULO;
	}

	return result;
}
