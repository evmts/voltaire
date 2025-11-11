import { InvalidFormatError } from "../errors/index.js";
import type { BrandedHex } from "./BrandedHex.js";
import { hexCharToValue } from "./utils.js";

/**
 * Validate hex string
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param value - String to validate as hex
 * @returns Validated hex string
 * @throws {InvalidFormatError} If missing 0x prefix or contains invalid hex characters
 * @example
 * ```typescript
 * import * as Hex from './primitives/Hex/index.js';
 * const hex = Hex.validate('0x1234'); // BrandedHex
 * ```
 */
export function validate(value: string): BrandedHex {
	if (value.length < 2 || !value.startsWith("0x"))
		throw new InvalidFormatError("Invalid hex format: missing 0x prefix", {
			code: "HEX_MISSING_PREFIX",
			value,
			expected: "0x-prefixed hex string",
			docsPath: "/primitives/hex#error-handling",
		});

	for (let i = 2; i < value.length; i++) {
		if (hexCharToValue(value[i]) === null)
			throw new InvalidFormatError(
				`Invalid hex character at position ${i}: '${value[i]}'`,
				{
					code: "HEX_INVALID_CHARACTER",
					value,
					expected: "valid hex characters (0-9, a-f, A-F)",
					context: { position: i, character: value[i] },
					docsPath: "/primitives/hex#error-handling",
				},
			);
	}
	return value as BrandedHex;
}
