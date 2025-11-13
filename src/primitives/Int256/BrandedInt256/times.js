import { MAX, MIN, MODULO } from "./constants.js";

/**
 * Multiply Int256 values with wrapping (EVM MUL with signed interpretation)
 *
 * @see https://voltaire.tevm.sh/primitives/int256 for Int256 documentation
 * @since 0.0.0
 * @param {import('./BrandedInt256.js').BrandedInt256} a - First operand
 * @param {import('./BrandedInt256.js').BrandedInt256} b - Second operand
 * @returns {import('./BrandedInt256.js').BrandedInt256} Product with wrapping
 * @example
 * ```javascript
 * import * as Int256 from './primitives/Int256/index.js';
 * const a = Int256.from(10n);
 * const b = Int256.from(-5n);
 * const product = Int256.times(a, b); // -50n
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
