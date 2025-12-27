/**
 * Compare two Bytes16 values
 *
 * @see https://voltaire.tevm.sh/primitives/bytes/bytes16 for documentation
 * @since 0.0.0
 * @param {import('./Bytes16Type.ts').Bytes16Type} a - First value
 * @param {import('./Bytes16Type.ts').Bytes16Type} b - Second value
 * @returns {number} -1 if a < b, 0 if equal, 1 if a > b
 * @example
 * ```javascript
 * import * as Bytes16 from './primitives/Bytes/Bytes16/index.js';
 * const result = Bytes16.compare(a, b);
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
