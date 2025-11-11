import type { BrandedHex } from "./BrandedHex.js";
import {
	InvalidCharacterError,
	InvalidFormatError,
	OddLengthError,
} from "./errors.js";
import { fromBytes } from "./fromBytes.js";
import { hexCharToValue } from "./utils.js";

/**
 * Trim leading zeros from hex
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param hex - Hex string to trim
 * @returns Trimmed hex string
 * @throws {InvalidFormatError} If missing 0x prefix
 * @throws {OddLengthError} If hex has odd number of digits
 * @throws {InvalidCharacterError} If contains invalid hex characters
 * @example
 * ```typescript
 * import * as Hex from './primitives/Hex/index.js';
 * const hex = Hex.from('0x00001234');
 * const trimmed = Hex.trim(hex); // '0x1234'
 * ```
 */
export function trim(hex: BrandedHex): BrandedHex {
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
	let start = 0;
	while (start < bytes.length && bytes[start] === 0) start++;
	return fromBytes(bytes.slice(start));
}
