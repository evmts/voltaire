/**
 * Check Int128 equality
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int128 documentation
 * @since 0.0.0
 * @param {import('./BrandedInt128.js').BrandedInt128} a - First value
 * @param {import('./BrandedInt128.js').BrandedInt128} b - Second value
 * @returns {boolean} True if equal
 * @example
 * ```javascript
 * import * as Int128 from './primitives/Int128/index.js';
 * const a = Int128.from(-42n);
 * const b = Int128.from(-42n);
 * Int128.equals(a, b); // true
 * ```
 */
export function equals(a, b) {
	return a === b;
}
