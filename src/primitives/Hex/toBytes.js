import { InvalidFormatError, InvalidLengthError } from "../errors/index.js";
import { hexCharToValue } from "./utils.js";

/**
 * Convert hex to bytes
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param {import('./HexType.js').HexType} hex - Hex string to convert
 * @returns {Uint8Array} Byte array
 * @throws {InvalidFormatError} If missing 0x prefix or contains invalid hex characters
 * @throws {InvalidLengthError} If hex has odd number of digits
 * @example
 * ```javascript
 * import * as Hex from './primitives/Hex/index.js';
 * const hex = Hex.from('0x1234');
 * const bytes = Hex.toBytes(hex); // Uint8Array([0x12, 0x34])
 * ```
 */
export function toBytes(hex) {
	if (!hex.startsWith("0x"))
		throw new InvalidFormatError("Invalid hex format: missing 0x prefix", {
			code: "HEX_MISSING_PREFIX",
			value: hex,
			expected: "0x-prefixed hex string",
			docsPath: "/primitives/hex#error-handling",
		});

	const hexDigits = hex.slice(2);

	// Check for invalid characters first (more helpful error message)
	for (let i = 0; i < hexDigits.length; i++) {
		const char = hexDigits[i];
		const val = hexCharToValue(char);
		if (val === null)
			throw new InvalidFormatError(
				`Invalid hex character at position ${i + 2}: '${char}'`,
				{
					code: "HEX_INVALID_CHARACTER",
					value: hex,
					expected: "valid hex characters (0-9, a-f, A-F)",
					context: {
						position: i + 2,
						character: char,
					},
					docsPath: "/primitives/hex#error-handling",
				},
			);
	}

	if (hexDigits.length % 2 !== 0)
		throw new InvalidLengthError("Invalid hex length: odd number of digits", {
			code: "HEX_ODD_LENGTH",
			value: hex,
			expected: "even number of hex digits",
			docsPath: "/primitives/hex#error-handling",
		});

	const bytes = new Uint8Array(hexDigits.length / 2);
	for (let i = 0; i < hexDigits.length; i += 2) {
		const high = hexCharToValue(hexDigits[i]);
		const low = hexCharToValue(hexDigits[i + 1]);
		bytes[i / 2] = /** @type {number} */ (high) * 16 + /** @type {number} */ (low);
	}
	return bytes;
}
