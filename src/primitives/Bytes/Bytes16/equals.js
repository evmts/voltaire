/**
 * Check if two Bytes16 values are equal
 *
 * @see https://voltaire.tevm.sh/primitives/bytes/bytes16 for documentation
 * @since 0.0.0
 * @param {import('./BrandedBytes16.ts').BrandedBytes16} a - First value
 * @param {import('./BrandedBytes16.ts').BrandedBytes16} b - Second value
 * @returns {boolean} True if equal
 * @example
 * ```javascript
 * import * as Bytes16 from './primitives/Bytes/Bytes16/index.js';
 * const equal = Bytes16.equals(a, b);
 * ```
 */
export function equals(a, b) {
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) return false;
	}
	return true;
}
