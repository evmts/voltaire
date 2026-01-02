import { InvalidCharacterError, InvalidFormatError } from "./errors.js";
import { hexCharToValue } from "./utils.js";

/**
 * Validate hex string
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param {string} value - String to validate as hex
 * @returns {string} Validated hex string
 * @throws {InvalidFormatError} If missing 0x prefix
 * @throws {InvalidCharacterError} If contains invalid hex characters
 * @example
 * ```javascript
 * import * as Hex from './primitives/Hex/index.js';
 * const hex = Hex.validate('0x1234'); // HexType
 * ```
 */
export function validate(value) {
	if (value.length < 2 || !value.startsWith("0x"))
		throw new InvalidFormatError("Invalid hex format: missing 0x prefix", {
			code: "HEX_MISSING_PREFIX",
			value,
			expected: "0x-prefixed hex string",
		});

	for (let i = 2; i < value.length; i++) {
		if (hexCharToValue(value[i]) === null)
			throw new InvalidCharacterError(
				`Invalid hex character at position ${i}: '${value[i]}'`,
				{
					value,
					context: { position: i, character: value[i] },
				},
			);
	}
	return value;
}
