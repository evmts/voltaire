import { MAX, MIN, MODULO } from "./constants.js";

/**
 * Negate Int128 value with wrapping
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int128 documentation
 * @since 0.0.0
 * @param {import('./BrandedInt128.js').BrandedInt128} value - Input value
 * @returns {import('./BrandedInt128.js').BrandedInt128} Negated value with wrapping
 * @example
 * ```javascript
 * import * as Int128 from './primitives/Int128/index.js';
 * const a = Int128.from(42n);
 * Int128.negate(a); // -42n
 * const min = Int128.from(Int128.MIN);
 * Int128.negate(min); // MIN (wraps around)
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
