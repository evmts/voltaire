import type { Unsized } from "./Hex.js";
import { InvalidFormatError, OddLengthError, InvalidCharacterError } from "./errors.js";
import { hexCharToValue } from "./utils.js";
import { fromBytes } from "./fromBytes.js";

/**
 * Slice hex string
 *
 * @param start - Start byte index
 * @param end - End byte index (optional)
 * @returns Sliced hex string
 *
 * @example
 * ```typescript
 * const hex: Hex = '0x123456';
 * const sliced = Hex.slice.call(hex, 1); // '0x3456'
 * ```
 */
export function slice(this: Unsized, start: number, end?: number): Unsized {
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
	return fromBytes(bytes.slice(start, end));
}
