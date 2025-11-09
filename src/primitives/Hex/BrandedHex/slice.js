import {
	InvalidCharacterError,
	InvalidFormatError,
	OddLengthError,
} from "./errors.js";
import { fromBytes } from "./fromBytes.js";
import { hexCharToValue } from "./utils.js";

/**
 * Slice hex string
 *
 * @param {string} hex - Hex string to slice
 * @param {number} start - Start byte index
 * @param {number} [end] - End byte index (optional)
 * @returns {string} Sliced hex string
 *
 * @example
 * ```typescript
 * const hex = Hex('0x123456');
 * const sliced1 = Hex.slice(hex, 1); // '0x3456'
 * const sliced2 = hex.slice(1); // '0x3456'
 * ```
 */
export function slice(hex, start, end) {
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
	return fromBytes(bytes.slice(start, end));
}
