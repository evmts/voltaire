import { MAX, MIN, MODULO } from "./constants.js";

/**
 * Subtract Int128 values with wrapping
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int128 documentation
 * @since 0.0.0
 * @param {import('./BrandedInt128.js').BrandedInt128} a - Minuend
 * @param {import('./BrandedInt128.js').BrandedInt128} b - Subtrahend
 * @returns {import('./BrandedInt128.js').BrandedInt128} Difference with wrapping
 * @example
 * ```javascript
 * import * as Int128 from './primitives/Int128/index.js';
 * const a = Int128.from(100n);
 * const b = Int128.from(50n);
 * const diff = Int128.minus(a, b); // 50n
 * ```
 */
export function minus(a, b) {
	const diff = a - b;

	// Handle wrapping
	if (diff > MAX) {
		return diff - MODULO;
	}
	if (diff < MIN) {
		return diff + MODULO;
	}

	return diff;
}
