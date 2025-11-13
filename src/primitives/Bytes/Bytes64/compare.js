/**
 * Compare two Bytes64 values
 *
 * @see https://voltaire.tevm.sh/primitives/bytes/bytes64 for documentation
 * @since 0.0.0
 * @param {import('./BrandedBytes64.ts').BrandedBytes64} a - First value
 * @param {import('./BrandedBytes64.ts').BrandedBytes64} b - Second value
 * @returns {number} -1 if a < b, 0 if equal, 1 if a > b
 * @example
 * ```javascript
 * import * as Bytes64 from './primitives/Bytes/Bytes64/index.js';
 * const result = Bytes64.compare(a, b);
 * ```
 */
export function compare(a, b) {
	for (let i = 0; i < a.length; i++) {
		if (a[i] < b[i]) return -1;
		if (a[i] > b[i]) return 1;
	}
	return 0;
}
