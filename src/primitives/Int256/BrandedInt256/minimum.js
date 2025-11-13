/**
 * Return minimum of two Int256 values
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int256 documentation
 * @since 0.0.0
 * @param {import('./BrandedInt256.js').BrandedInt256} a - First value
 * @param {import('./BrandedInt256.js').BrandedInt256} b - Second value
 * @returns {import('./BrandedInt256.js').BrandedInt256} Minimum value
 * @example
 * ```javascript
 * import * as Int256 from './primitives/Int256/index.js';
 * const a = Int256.from(-42n);
 * const b = Int256.from(10n);
 * Int256.minimum(a, b); // -42n
 * ```
 */
export function minimum(a, b) {
	return a < b ? a : b;
}
