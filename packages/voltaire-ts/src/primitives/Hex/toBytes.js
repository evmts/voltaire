import { InvalidFormatError, InvalidLengthError } from "../errors/index.js";
import { decodeHexDigitsInto } from "./decodeHexDigitsInto.js";
import { hexCharToValue } from "./utils.js";

/**
 * Convert hex to bytes
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param {import('./HexType.js').HexType | `0x${string}` | string} hex - Hex string to convert
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

	const digits = hex.length - 2;
	const bytes = new Uint8Array(digits >>> 1);

	// Invalid characters are reported before odd length (more helpful error),
	// so the trailing digit of an odd-length string is validated too.
	let invalid = decodeHexDigitsInto(hex, 2, bytes);
	if (
		invalid === -1 &&
		digits % 2 !== 0 &&
		hexCharToValue(hex[hex.length - 1]) === null
	)
		invalid = digits - 1;

	if (invalid !== -1) {
		const position = invalid + 2;
		const char = hex[position];
		throw new InvalidFormatError(
			`Invalid hex character at position ${position}: '${char}'`,
			{
				code: "HEX_INVALID_CHARACTER",
				value: hex,
				expected: "valid hex characters (0-9, a-f, A-F)",
				context: {
					position,
					character: char,
				},
				docsPath: "/primitives/hex#error-handling",
			},
		);
	}

	if (digits % 2 !== 0)
		throw new InvalidLengthError("Invalid hex length: odd number of digits", {
			code: "HEX_ODD_LENGTH",
			value: hex,
			expected: "even number of hex digits",
			docsPath: "/primitives/hex#error-handling",
		});

	return bytes;
}
