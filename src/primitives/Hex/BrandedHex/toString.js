import {
	InvalidCharacterError,
	InvalidFormatError,
	OddLengthError,
} from "./errors.js";
import { hexCharToValue } from "./utils.js";

/**
 * Convert hex to string
 *
 * @param {import('./BrandedHex.js').BrandedHex} hex - Hex string to convert
 * @returns {string} Decoded string
 *
 * @example
 * ```typescript
 * const hex = Hex('0x68656c6c6f');
 * const str1 = Hex.toString(hex); // 'hello'
 * const str2 = hex.toString(); // 'hello'
 * ```
 */
export function toString(hex) {
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
	const decoder = new TextDecoder();
	return decoder.decode(bytes);
}
