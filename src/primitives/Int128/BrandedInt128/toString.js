/**
 * Convert Int128 to decimal string
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int128 documentation
 * @since 0.0.0
 * @param {import('./BrandedInt128.js').BrandedInt128} value - Int128 value
 * @returns {string} Decimal string
 * @example
 * ```javascript
 * import * as Int128 from './primitives/Int128/index.js';
 * const a = Int128.from(-42n);
 * Int128.toString(a); // "-42"
 * ```
 */
export function toString(value) {
	return value.toString();
}
