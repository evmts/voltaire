/**
 * Convert bytes to hex
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param {Uint8Array} bytes - Byte array to convert
 * @returns {import('./HexType.js').HexType} Hex string
 * @throws {never}
 * @example
 * ```javascript
 * import * as Hex from './primitives/Hex/index.js';
 * const bytes = new Uint8Array([0x12, 0x34]);
 * const hex = Hex.fromBytes(bytes); // '0x1234'
 * ```
 */
export function fromBytes(bytes) {
	let hex = "0x";
	for (let i = 0; i < bytes.length; i++) {
		const byte = bytes[i];
		hex += byte.toString(16).padStart(2, "0");
	}
	return /** @type {import('./HexType.js').HexType} */ (hex);
}
