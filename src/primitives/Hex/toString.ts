import type { Unsized } from "./Hex.js";
import {
	InvalidCharacterError,
	InvalidFormatError,
	OddLengthError,
} from "./errors.js";
import { hexCharToValue } from "./utils.js";

/**
 * Convert hex to string
 *
 * @returns Decoded string
 *
 * @example
 * ```typescript
 * const hex: Hex = '0x68656c6c6f';
 * const str = Hex.toString.call(hex); // 'hello'
 * ```
 */
export function toString(this: Unsized): string {
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
	const decoder = new TextDecoder();
	return decoder.decode(bytes);
}
