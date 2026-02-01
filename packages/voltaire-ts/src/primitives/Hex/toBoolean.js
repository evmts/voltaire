import { InvalidBooleanHexError } from "./errors.js";
import { toBytes } from "./toBytes.js";

/**
 * Convert hex to boolean (strict: only 0x0/0x00 or 0x1/0x01 are valid)
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param {import('./HexType.js').HexType} hex - Hex string to convert
 * @returns {boolean} Boolean value (true for 0x1/0x01, false for 0x0/0x00)
 * @throws {InvalidBooleanHexError} If hex is not a valid boolean value (only 0 or 1 allowed)
 * @example
 * ```javascript
 * import * as Hex from './primitives/Hex/index.js';
 * const hex = Hex.from('0x01');
 * const bool = Hex.toBoolean(hex); // true
 * Hex.toBoolean('0x00'); // false
 * Hex.toBoolean('0x02'); // throws InvalidBooleanHexError
 * ```
 */
export function toBoolean(hex) {
	const bytes = toBytes(hex);
	// Must be exactly 0 or 1 (any size, but all zeros or single 1 in last byte)
	const isZero = bytes.every((b) => b === 0);
	if (isZero) return false;

	// Check if it's exactly 1 (all zeros except last byte which is 1)
	const isOne =
		bytes.length > 0 &&
		bytes[bytes.length - 1] === 1 &&
		bytes.slice(0, -1).every((b) => b === 0);
	if (isOne) return true;

	throw new InvalidBooleanHexError(
		`Invalid boolean hex value: ${hex}. Only 0x0/0x00 or 0x1/0x01 are valid.`,
		{ value: hex },
	);
}
