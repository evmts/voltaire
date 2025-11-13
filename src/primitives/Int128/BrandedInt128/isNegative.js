/**
 * Check if Int128 is negative
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int128 documentation
 * @since 0.0.0
 * @param {import('./BrandedInt128.js').BrandedInt128} value - Input value
 * @returns {boolean} True if negative
 * @example
 * ```javascript
 * import * as Int128 from './primitives/Int128/index.js';
 * const a = Int128.from(-42n);
 * Int128.isNegative(a); // true
 * ```
 */
export function isNegative(value) {
	return value < 0n;
}
