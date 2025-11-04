import type { BrandedHex } from "./BrandedHex.js";
import {
	InvalidCharacterError,
	InvalidFormatError,
	OddLengthError,
} from "./errors.js";
import { fromBytes } from "./fromBytes.js";
import { hexCharToValue } from "./utils.js";

/**
 * Pad hex to target size (left-padded with zeros)
 *
 * @param hex - Hex string to pad
 * @param targetSize - Target size in bytes
 * @returns Padded hex string
 *
 * @example
 * ```typescript
 * const hex = Hex('0x1234');
 * const padded1 = Hex.pad(hex, 4); // '0x00001234'
 * const padded2 = hex.pad(4); // '0x00001234'
 * ```
 */
export function pad(hex: BrandedHex, targetSize: number): BrandedHex {
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
	if (bytes.length >= targetSize) return fromBytes(bytes);
	const padded = new Uint8Array(targetSize);
	padded.set(bytes, targetSize - bytes.length);
	return fromBytes(padded);
}
