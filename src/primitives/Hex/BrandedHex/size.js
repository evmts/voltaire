/**
 * Get byte size of hex
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param {string} hex - Hex string
 * @returns {number} Size in bytes
 * @throws {never}
 * @example
 * ```javascript
 * import * as Hex from './primitives/Hex/index.js';
 * const hex = Hex.from('0x1234');
 * Hex.size(hex); // 2
 * ```
 */
export function size(hex) {
	return (hex.length - 2) / 2;
}
