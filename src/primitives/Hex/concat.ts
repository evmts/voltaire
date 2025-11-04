import type { Unsized } from "./Hex.js";
import {
	InvalidCharacterError,
	InvalidFormatError,
	OddLengthError,
} from "./errors.js";
import { fromBytes } from "./fromBytes.js";
import { hexCharToValue } from "./utils.js";

/**
 * Concatenate multiple hex strings
 *
 * @param hexes - Hex strings to concatenate
 * @returns Concatenated hex string
 *
 * @example
 * ```typescript
 * Hex.concat('0x12', '0x34', '0x56'); // '0x123456'
 * ```
 */
export function concat(...hexes: Unsized[]): Unsized {
	const allBytes = hexes.flatMap((h) => {
		if (!h.startsWith("0x")) throw new InvalidFormatError();
		const hexDigits = h.slice(2);
		if (hexDigits.length % 2 !== 0) throw new OddLengthError();
		const bytes = new Uint8Array(hexDigits.length / 2);
		for (let i = 0; i < hexDigits.length; i += 2) {
			const high = hexCharToValue(hexDigits[i]);
			const low = hexCharToValue(hexDigits[i + 1]);
			if (high === null || low === null) throw new InvalidCharacterError();
			bytes[i / 2] = high * 16 + low;
		}
		return Array.from(bytes);
	});
	return fromBytes(new Uint8Array(allBytes));
}
