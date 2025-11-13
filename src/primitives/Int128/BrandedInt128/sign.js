/**
 * Get sign of Int128 value
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int128 documentation
 * @since 0.0.0
 * @param {import('./BrandedInt128.js').BrandedInt128} value - Input value
 * @returns {-1 | 0 | 1} -1 for negative, 0 for zero, 1 for positive
 * @example
 * ```javascript
 * import * as Int128 from './primitives/Int128/index.js';
 * const a = Int128.from(-42n);
 * Int128.sign(a); // -1
 * const b = Int128.from(0n);
 * Int128.sign(b); // 0
 * const c = Int128.from(42n);
 * Int128.sign(c); // 1
 * ```
 */
export function sign(value) {
	if (value < 0n) return -1;
	if (value > 0n) return 1;
	return 0;
}
