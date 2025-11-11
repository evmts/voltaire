import {
	InvalidCharacterError,
	InvalidFormatError,
	OddLengthError,
} from "./errors.js";
import { hexCharToValue } from "./utils.js";

/**
 * Convert hex to string
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param {import('./BrandedHex.js').BrandedHex} hex - Hex string to convert
 * @returns {string} Decoded string
 * @throws {InvalidFormatError} If missing 0x prefix
 * @throws {OddLengthError} If hex has odd number of digits
 * @throws {InvalidCharacterError} If contains invalid hex characters
 * @example
 * ```javascript
 * import * as Hex from './primitives/Hex/index.js';
 * const hex = Hex.from('0x68656c6c6f');
 * const str = Hex.toString(hex); // 'hello'
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
