import { InvalidLengthError } from "./errors.js";

/**
 * Assert hex has specific size
 *
 * @param {string} hex - Hex string to check
 * @param {number} targetSize - Expected byte size
 * @returns {string} Sized hex string
 * @throws {InvalidLengthError} If size doesn't match
 *
 * @example
 * ```typescript
 * const hex = Hex('0x1234');
 * const sized1 = Hex.assertSize(hex, 2); // Sized<2>
 * const sized2 = hex.assertSize(2); // Sized<2>
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
