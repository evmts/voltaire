import type { BrandedHex } from "./BrandedHex.js";
import {
	InvalidCharacterError,
	InvalidFormatError,
	OddLengthError,
} from "./errors.js";
import { hexCharToValue } from "./utils.js";

/**
 * Convert hex to bytes
 *
 * @param hex - Hex string to convert
 * @returns Byte array
 * @throws {InvalidFormatError} If missing 0x prefix
 * @throws {OddLengthError} If hex has odd number of digits
 * @throws {InvalidCharacterError} If contains invalid hex characters
 *
 * @example
 * ```typescript
 * const hex = Hex('0x1234');
 * const bytes = Hex.toBytes(hex); // Uint8Array([0x12, 0x34])
 * const bytes2 = hex.toBytes(); // Same result
 * ```
 */
export function toBytes(hex: BrandedHex): Uint8Array {
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
	return bytes;
}
