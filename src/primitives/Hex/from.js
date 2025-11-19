/**
 * Create Hex from string (alias for fromString)
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param {string} value - Hex string (with or without 0x prefix)
 * @returns {import('./HexType.js').HexType} Hex value
 * @throws {never}
 * @example
 * ```javascript
 * import * as Hex from './primitives/Hex/index.js';
 * const hex = Hex.from('0x1234'); // '0x1234'
 * const hex2 = Hex.from('1234'); // '0x1234'
 * ```
 */
export function from(value) {
	const normalized = value.startsWith("0x") ? value : `0x${value}`;
	return /** @type {import('./HexType.js').HexType} */ (normalized);
}
