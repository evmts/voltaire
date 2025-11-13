/**
 * Check if Int256 is greater than another
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int256 documentation
 * @since 0.0.0
 * @param {import('./BrandedInt256.js').BrandedInt256} a - First value
 * @param {import('./BrandedInt256.js').BrandedInt256} b - Second value
 * @returns {boolean} True if a > b
 * @example
 * ```javascript
 * import * as Int256 from './primitives/Int256/index.js';
 * const a = Int256.from(0n);
 * const b = Int256.from(-1n);
 * Int256.greaterThan(a, b); // true
 * ```
 */
export function greaterThan(a, b) {
	return a > b;
}
