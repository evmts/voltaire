import type { BrandedHex } from "./BrandedHex.js";
import { InvalidCharacterError, InvalidFormatError } from "./errors.js";
import { hexCharToValue } from "./utils.js";

/**
 * Validate hex string
 *
 * @param value - String to validate as hex
 * @returns Validated hex string
 * @throws {InvalidFormatError} If missing 0x prefix
 * @throws {InvalidCharacterError} If contains invalid hex characters
 *
 * @example
 * ```typescript
 * const hex = Hex.validate('0x1234'); // BrandedHex
 * ```
 */
export function validate(value: string): BrandedHex {
	if (value.length < 2 || !value.startsWith("0x")) throw new InvalidFormatError();
	for (let i = 2; i < value.length; i++) {
		if (hexCharToValue(value[i]) === null) throw new InvalidCharacterError();
	}
	return value as BrandedHex;
}
