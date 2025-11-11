import { InvalidLengthError } from "./errors.js";

/**
 * Assert hex has specific size
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param {string} hex - Hex string to check
 * @param {number} targetSize - Expected byte size
 * @returns {string} Sized hex string
 * @throws {InvalidLengthError} If size doesn't match
 * @example
 * ```javascript
 * import * as Hex from './primitives/Hex/index.js';
 * const hex = Hex.from('0x1234');
 * const sized = Hex.assertSize(hex, 2); // Sized<2>
 * ```
 */
export function assertSize(hex, targetSize) {
	if ((hex.length - 2) / 2 !== targetSize) {
		throw new InvalidLengthError(
			`Expected ${targetSize} bytes, got ${(hex.length - 2) / 2}`,
		);
	}
	return hex;
}
