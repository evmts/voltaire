import type { Unsized } from "./Hex.js";
import { InvalidFormatError, OddLengthError, InvalidCharacterError } from "./errors.js";
import { hexCharToValue } from "./utils.js";
import { fromBytes } from "./fromBytes.js";

/**
 * Pad hex to target size (left-padded with zeros)
 *
 * @param targetSize - Target size in bytes
 * @returns Padded hex string
 *
 * @example
 * ```typescript
 * const hex: Hex = '0x1234';
 * const padded = Hex.pad.call(hex, 4); // '0x00001234'
 * ```
 */
export function pad(this: Unsized, targetSize: number): Unsized {
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
	if (bytes.length >= targetSize) return fromBytes(bytes);
	const padded = new Uint8Array(targetSize);
	padded.set(bytes, targetSize - bytes.length);
	return fromBytes(padded);
}
