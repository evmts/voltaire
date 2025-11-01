import type { Unsized } from "./Hex.js";
import { InvalidFormatError, OddLengthError, InvalidCharacterError } from "./errors.js";
import { hexCharToValue } from "./utils.js";
import { fromBytes } from "./fromBytes.js";

/**
 * Trim leading zeros from hex
 *
 * @returns Trimmed hex string
 *
 * @example
 * ```typescript
 * const hex: Hex = '0x00001234';
 * const trimmed = Hex.trim.call(hex); // '0x1234'
 * ```
 */
export function trim(this: Unsized): Unsized {
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
	let start = 0;
	while (start < bytes.length && bytes[start] === 0) start++;
	return fromBytes(bytes.slice(start));
}
