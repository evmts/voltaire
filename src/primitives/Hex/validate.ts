import type { Unsized } from "./Hex.js";
import { InvalidFormatError, InvalidCharacterError } from "./errors.js";
import { hexCharToValue } from "./utils.js";

/**
 * Validate hex string
 *
 * @returns Validated hex string
 * @throws {InvalidFormatError} If missing 0x prefix
 * @throws {InvalidCharacterError} If contains invalid hex characters
 *
 * @example
 * ```typescript
 * const str = '0x1234';
 * const hex = Hex.validate.call(str); // validated Hex
 * ```
 */
export function validate(this: string): Unsized {
	if (this.length < 2 || !this.startsWith("0x")) throw new InvalidFormatError();
	for (let i = 2; i < this.length; i++) {
		if (hexCharToValue(this[i]) === null) throw new InvalidCharacterError();
	}
	return this as Unsized;
}
