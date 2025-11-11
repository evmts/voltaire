import { InvalidFormatError, InvalidLengthError } from "../../errors/index.js";
import { hexCharToValue } from "./utils.js";

/**
 * Convert hex to string
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param {import('./BrandedHex.js').BrandedHex} hex - Hex string to convert
 * @returns {string} Decoded string
 * @throws {InvalidFormatError} If missing 0x prefix or contains invalid hex characters
 * @throws {InvalidLengthError} If hex has odd number of digits
 * @example
 * ```javascript
 * import * as Hex from './primitives/Hex/index.js';
 * const hex = Hex.from('0x68656c6c6f');
 * const str = Hex.toString(hex); // 'hello'
 * ```
 */
export function toString(hex) {
	if (!hex.startsWith("0x"))
		throw new InvalidFormatError("Invalid hex format: missing 0x prefix", {
			code: "HEX_MISSING_PREFIX",
			value: hex,
			expected: "0x-prefixed hex string",
			docsPath: "/primitives/hex#error-handling",
		});

	const hexDigits = hex.slice(2);
	if (hexDigits.length % 2 !== 0)
		throw new InvalidLengthError("Invalid hex length: odd number of digits", {
			code: "HEX_ODD_LENGTH",
			value: hex,
			expected: "even number of hex digits",
			docsPath: "/primitives/hex#error-handling",
		});

	const bytes = new Uint8Array(hexDigits.length / 2);
	for (let i = 0; i < hexDigits.length; i += 2) {
		const charHigh = hexDigits[i];
		const charLow = hexDigits[i + 1];
		const high = hexCharToValue(charHigh);
		const low = hexCharToValue(charLow);
		if (high === null || low === null)
			throw new InvalidFormatError(
				`Invalid hex character at position ${i + 2}: '${charHigh ?? ""}${charLow ?? ""}'`,
				{
					code: "HEX_INVALID_CHARACTER",
					value: hex,
					expected: "valid hex characters (0-9, a-f, A-F)",
					context: {
						position: i + 2,
						character: (charHigh ?? "") + (charLow ?? ""),
					},
					docsPath: "/primitives/hex#error-handling",
				},
			);
		bytes[i / 2] = high * 16 + low;
	}
	const decoder = new TextDecoder();
	return decoder.decode(bytes);
}
