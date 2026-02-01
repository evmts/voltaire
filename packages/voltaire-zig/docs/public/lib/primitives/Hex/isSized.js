/**
 * Check if hex has specific byte size
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param {string} hex - Hex string to check
 * @param {number} targetSize - Expected size in bytes
 * @returns {boolean} True if size matches
 * @throws {never}
 * @example
 * ```javascript
 * import * as Hex from './primitives/Hex/index.js';
 * const hex = Hex.from('0x1234');
 * Hex.isSized(hex, 2); // true
 * ```
 */
export function isSized(hex, targetSize) {
	return (hex.length - 2) / 2 === targetSize;
}
