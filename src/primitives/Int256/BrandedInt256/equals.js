/**
 * Check Int256 equality
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int256 documentation
 * @since 0.0.0
 * @param {import('./BrandedInt256.js').BrandedInt256} a - First value
 * @param {import('./BrandedInt256.js').BrandedInt256} b - Second value
 * @returns {boolean} True if equal
 * @example
 * ```javascript
 * import * as Int256 from './primitives/Int256/index.js';
 * const a = Int256.from(-42n);
 * const b = Int256.from(-42n);
 * Int256.equals(a, b); // true
 * ```
 */
export function equals(a, b) {
	return a === b;
}
