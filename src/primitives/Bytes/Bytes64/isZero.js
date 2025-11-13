/**
 * Check if Bytes64 is all zeros
 *
 * @see https://voltaire.tevm.sh/primitives/bytes/bytes64 for documentation
 * @since 0.0.0
 * @param {import('./BrandedBytes64.ts').BrandedBytes64} bytes - Value to check
 * @returns {boolean} True if all zeros
 * @example
 * ```javascript
 * import * as Bytes64 from './primitives/Bytes/Bytes64/index.js';
 * const isAllZeros = Bytes64.isZero(bytes);
 * ```
 */
export function isZero(bytes) {
	for (let i = 0; i < bytes.length; i++) {
		if (bytes[i] !== 0) return false;
	}
	return true;
}
