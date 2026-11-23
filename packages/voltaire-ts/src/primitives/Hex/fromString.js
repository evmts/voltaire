import { HEX_BYTE_TABLE } from "./hexLookup.js";

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
		hex += HEX_BYTE_TABLE[bytes[i]];
	}
	return /** @type {import('./HexType.js').HexType} */ (hex);
}
