import type { Unsized } from "./Hex.js";
import { InvalidFormatError, OddLengthError, InvalidCharacterError } from "./errors.js";
import { hexCharToValue } from "./utils.js";

/**
 * Convert hex to bytes
 *
 * @returns Byte array
 * @throws {InvalidFormatError} If missing 0x prefix
 * @throws {OddLengthError} If hex has odd number of digits
 * @throws {InvalidCharacterError} If contains invalid hex characters
 *
 * @example
 * ```typescript
 * const hex: Hex = '0x1234';
 * const bytes = Hex.toBytes.call(hex); // Uint8Array([0x12, 0x34])
 * ```
 */
export function toBytes(this: Unsized): Uint8Array {
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
	return bytes;
}
