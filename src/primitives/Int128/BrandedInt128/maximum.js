/**
 * Return maximum of two Int128 values
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int128 documentation
 * @since 0.0.0
 * @param {import('./BrandedInt128.js').BrandedInt128} a - First value
 * @param {import('./BrandedInt128.js').BrandedInt128} b - Second value
 * @returns {import('./BrandedInt128.js').BrandedInt128} Maximum value
 * @example
 * ```javascript
 * import * as Int128 from './primitives/Int128/index.js';
 * const a = Int128.from(-42n);
 * const b = Int128.from(10n);
 * Int128.maximum(a, b); // 10n
 * ```
 */
export function maximum(a, b) {
	return a > b ? a : b;
}
