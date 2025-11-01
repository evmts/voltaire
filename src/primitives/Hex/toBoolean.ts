import type { Unsized } from "./Hex.js";
import { InvalidFormatError, OddLengthError, InvalidCharacterError } from "./errors.js";
import { hexCharToValue } from "./utils.js";

/**
 * Convert hex to boolean
 *
 * @returns Boolean value (true if non-zero, false if zero)
 *
 * @example
 * ```typescript
 * const hex: Hex = '0x01';
 * const bool = Hex.toBoolean.call(hex); // true
 * ```
 */
export function toBoolean(this: Unsized): boolean {
	if (!this.startsWith("0x")) throw new InvalidFormatError();
	const hexDigits = this.slice(2);
	if (hexDigits.length % 2 !== 0) throw new OddLengthError();
	const bytes = new Uint8Array(hexDigits.length / 2);
	for (let i = 0; i < hexDigits.length; i += 2) {
		const high = hexCharToValue(hexDigits[i]);
		const low = hexCharToValue(hexDigits[i + 1]);
		if (high === null || low === null) throw new InvalidCharacterError();
		bytes[i / 2] = high * 16 + low;
	}
	return bytes.some((b) => b !== 0);
}
