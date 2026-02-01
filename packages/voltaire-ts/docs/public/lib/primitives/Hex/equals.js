/**
 * Check if two hex values are equal (case-insensitive)
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param {import('./HexType.js').HexType} a - First hex value
 * @param {import('./HexType.js').HexType} b - Second hex value
 * @returns {boolean} True if equal
 * @throws {never}
 * @example
 * ```javascript
 * import * as Hex from './primitives/Hex/index.js';
 * Hex.equals('0xABCD', '0xabcd'); // true
 * Hex.equals('0x1234', '0x5678'); // false
 * ```
 */
export function equals(a, b) {
	return a.toLowerCase() === b.toLowerCase();
}
