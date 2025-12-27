/**
 * Compare two Bytes64 values
 *
 * @see https://voltaire.tevm.sh/primitives/bytes/bytes64 for documentation
 * @since 0.0.0
 * @param {import('./Bytes64Type.ts').Bytes64Type} a - First value
 * @param {import('./Bytes64Type.ts').Bytes64Type} b - Second value
 * @returns {number} -1 if a < b, 0 if equal, 1 if a > b
 * @example
 * ```javascript
 * import * as Bytes64 from './primitives/Bytes/Bytes64/index.js';
 * const result = Bytes64.compare(a, b);
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
