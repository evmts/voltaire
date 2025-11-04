import type { BrandedHex } from "./BrandedHex.js";
import {
	InvalidCharacterError,
	InvalidFormatError,
	OddLengthError,
} from "./errors.js";
import { hexCharToValue } from "./utils.js";

/**
 * Convert hex to boolean
 *
 * @param hex - Hex string to convert
 * @returns Boolean value (true if non-zero, false if zero)
 *
 * @example
 * ```typescript
 * const hex = Hex('0x01');
 * const bool1 = Hex.toBoolean(hex); // true
 * const bool2 = hex.toBoolean(); // true
 * ```
 */
export function toBoolean(hex: BrandedHex): boolean {
	if (!hex.startsWith("0x")) throw new InvalidFormatError();
	const hexDigits = hex.slice(2);
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
