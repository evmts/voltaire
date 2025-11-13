/**
 * Check if Int128 is less than another
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int128 documentation
 * @since 0.0.0
 * @param {import('./BrandedInt128.js').BrandedInt128} a - First value
 * @param {import('./BrandedInt128.js').BrandedInt128} b - Second value
 * @returns {boolean} True if a < b
 * @example
 * ```javascript
 * import * as Int128 from './primitives/Int128/index.js';
 * const a = Int128.from(-1n);
 * const b = Int128.from(0n);
 * Int128.lessThan(a, b); // true
 * ```
 */
export function lessThan(a, b) {
	return a < b;
}
