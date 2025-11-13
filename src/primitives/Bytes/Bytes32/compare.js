/**
 * Compare two Bytes32 values
 *
 * @see https://voltaire.tevm.sh/primitives/bytes/bytes32 for documentation
 * @since 0.0.0
 * @param {import('./BrandedBytes32.ts').BrandedBytes32} a - First value
 * @param {import('./BrandedBytes32.ts').BrandedBytes32} b - Second value
 * @returns {number} -1 if a < b, 0 if equal, 1 if a > b
 * @example
 * ```javascript
 * import * as Bytes32 from './primitives/Bytes/Bytes32/index.js';
 * const result = Bytes32.compare(a, b);
 * ```
 */
export function compare(a, b) {
	for (let i = 0; i < a.length; i++) {
		if (a[i] < b[i]) return -1;
		if (a[i] > b[i]) return 1;
	}
	return 0;
}
