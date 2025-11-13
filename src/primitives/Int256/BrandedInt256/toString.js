/**
 * Convert Int256 to decimal string
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int256 documentation
 * @since 0.0.0
 * @param {import('./BrandedInt256.js').BrandedInt256} value - Int256 value
 * @returns {string} Decimal string
 * @example
 * ```javascript
 * import * as Int256 from './primitives/Int256/index.js';
 * const a = Int256.from(-42n);
 * Int256.toString(a); // "-42"
 * ```
 */
export function toString(value) {
	return value.toString();
}
