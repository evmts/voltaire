/**
 * Compare two Bytes16 values lexicographically (byte-by-byte from left to right).
 *
 * @see https://voltaire.tevm.sh/primitives/bytes/bytes16 for documentation
 * @since 0.0.0
 * @param {import('./Bytes16Type.js').Bytes16Type} a - First value
 * @param {import('./Bytes16Type.js').Bytes16Type} b - Second value
 * @returns {-1 | 0 | 1} Comparison result:
 *   - `-1` if `a` is less than `b`
 *   - `0` if `a` equals `b`
 *   - `1` if `a` is greater than `b`
 * @example
 * ```javascript
 * import * as Bytes16 from './primitives/Bytes/Bytes16/index.js';
 * const result = Bytes16.compare(a, b);
 *
 * // Compatible with Array.sort
 * const sorted = [b3, b1, b2].sort(Bytes16.compare);
 * ```
 */
export function compare(a, b) {
	for (let i = 0; i < a.length; i++) {
		const ai = /** @type {number} */ (a[i]);
		const bi = /** @type {number} */ (b[i]);
		if (ai < bi) return -1;
		if (ai > bi) return 1;
	}
	return 0;
}
