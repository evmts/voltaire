/**
 * Check if Bytes16 is all zeros
 *
 * @see https://voltaire.tevm.sh/primitives/bytes/bytes16 for documentation
 * @since 0.0.0
 * @param {import('./BrandedBytes16.ts').BrandedBytes16} bytes - Value to check
 * @returns {boolean} True if all zeros
 * @example
 * ```javascript
 * import * as Bytes16 from './primitives/Bytes/Bytes16/index.js';
 * const isAllZeros = Bytes16.isZero(bytes);
 * ```
 */
export function isZero(bytes) {
	for (let i = 0; i < bytes.length; i++) {
		if (bytes[i] !== 0) return false;
	}
	return true;
}
