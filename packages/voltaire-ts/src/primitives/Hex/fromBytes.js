import { encodeHexDigits } from "./encodeHexDigits.js";
import { InvalidFormatError } from "./errors.js";

/**
 * Convert bytes to hex
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param {Uint8Array} bytes - Byte array to convert
 * @returns {import('./HexType.js').HexType} Hex string
 * @throws {InvalidFormatError} If input is not a Uint8Array
 * @example
 * ```javascript
 * import * as Hex from './primitives/Hex/index.js';
 * const bytes = new Uint8Array([0x12, 0x34]);
 * const hex = Hex.fromBytes(bytes); // '0x1234'
 * ```
 */
export function fromBytes(bytes) {
	if (!(bytes instanceof Uint8Array)) {
		throw new InvalidFormatError("Expected Uint8Array for Hex.fromBytes", {
			value: bytes,
			expected: "Uint8Array",
		});
	}
	return /** @type {import('./HexType.js').HexType} */ (
		`0x${encodeHexDigits(bytes)}`
	);
}
