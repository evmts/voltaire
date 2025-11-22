import { InvalidFormatError } from "../errors/index.js";

/**
 * Create Hex from string (alias for fromString)
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param {string} value - Hex string (with or without 0x prefix)
 * @returns {import('./HexType.js').HexType} Hex value
 * @throws {InvalidFormatError} If value contains invalid hex characters
 * @example
 * ```javascript
 * import * as Hex from './primitives/Hex/index.js';
 * const hex = Hex.from('0x1234'); // '0x1234'
 * const hex2 = Hex.from('1234'); // '0x1234'
 * ```
 */
export function from(value) {
	if (typeof value !== "string") {
		throw new InvalidFormatError(
			`Expected string, received ${typeof value}`,
			{
				code: "HEX_INVALID_TYPE",
				value,
				expected: "string",
				docsPath: "/primitives/hex#error-handling",
			},
		);
	}

	const normalized = value.startsWith("0x") ? value : `0x${value}`;

	// Validate hex characters (skip '0x' prefix)
	const hexDigits = normalized.slice(2);
	for (let i = 0; i < hexDigits.length; i++) {
		const char = hexDigits[i];
		const isValid =
			(char >= "0" && char <= "9") ||
			(char >= "a" && char <= "f") ||
			(char >= "A" && char <= "F");

		if (!isValid) {
			throw new InvalidFormatError(
				`Invalid hex character at position ${i + 2}: '${char}'`,
				{
					code: "HEX_INVALID_CHARACTER",
					value: normalized,
					expected: "valid hex characters (0-9, a-f, A-F)",
					context: {
						position: i + 2,
						character: char,
					},
					docsPath: "/primitives/hex#error-handling",
				},
			);
		}
	}

	return /** @type {import('./HexType.js').HexType} */ (normalized);
}
