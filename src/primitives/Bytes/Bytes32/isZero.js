/**
 * Check if Bytes32 is all zeros
 *
 * @see https://voltaire.tevm.sh/primitives/bytes/bytes32 for documentation
 * @since 0.0.0
 * @param {import('./BrandedBytes32.ts').BrandedBytes32} bytes - Value to check
 * @returns {boolean} True if all zeros
 * @example
 * ```javascript
 * import * as Bytes32 from './primitives/Bytes/Bytes32/index.js';
 * const isAllZeros = Bytes32.isZero(bytes);
 * ```
 */
export function isZero(bytes) {
	for (let i = 0; i < bytes.length; i++) {
		if (bytes[i] !== 0) return false;
	}
	return true;
}
