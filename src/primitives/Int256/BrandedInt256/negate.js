import { MAX, MIN, MODULO } from "./constants.js";

/**
 * Negate Int256 value with wrapping
 *
 * @see https://voltaire.tevm.sh/primitives/int256 for Int256 documentation
 * @since 0.0.0
 * @param {import('./BrandedInt256.js').BrandedInt256} value - Input value
 * @returns {import('./BrandedInt256.js').BrandedInt256} Negated value with wrapping
 * @example
 * ```javascript
 * import * as Int256 from './primitives/Int256/index.js';
 * const a = Int256.from(42n);
 * Int256.negate(a); // -42n
 * const min = Int256.from(Int256.MIN);
 * Int256.negate(min); // MIN (wraps around)
 * ```
 */
export function negate(value) {
	const negated = -value;

	// Handle wrapping for MIN
	if (negated > MAX) {
		return negated - MODULO;
	}
	if (negated < MIN) {
		return negated + MODULO;
	}

	return negated;
}
