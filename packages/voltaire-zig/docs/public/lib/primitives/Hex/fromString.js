/**
 * Convert string to hex
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param {string} value - String to convert
 * @returns {import('./HexType.js').HexType} Hex string
 * @throws {never}
 * @example
 * ```javascript
 * import * as Hex from './primitives/Hex/index.js';
 * Hex.fromString('hello'); // '0x68656c6c6f'
 * ```
 */
export function fromString(value) {
	const bytes = new TextEncoder().encode(value);
	let hex = "0x";
	for (let i = 0; i < bytes.length; i++) {
		hex += bytes[i].toString(16).padStart(2, "0");
	}
	return /** @type {import('./HexType.js').HexType} */ (hex);
}
