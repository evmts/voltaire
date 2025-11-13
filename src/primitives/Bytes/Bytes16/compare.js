/**
 * Compare two Bytes16 values
 *
 * @see https://voltaire.tevm.sh/primitives/bytes/bytes16 for documentation
 * @since 0.0.0
 * @param {import('./BrandedBytes16.ts').BrandedBytes16} a - First value
 * @param {import('./BrandedBytes16.ts').BrandedBytes16} b - Second value
 * @returns {number} -1 if a < b, 0 if equal, 1 if a > b
 * @example
 * ```javascript
 * import * as Bytes16 from './primitives/Bytes/Bytes16/index.js';
 * const result = Bytes16.compare(a, b);
 * ```
 */
export function compare(a, b) {
	for (let i = 0; i < a.length; i++) {
		if (a[i] < b[i]) return -1;
		if (a[i] > b[i]) return 1;
	}
	return 0;
}
