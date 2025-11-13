import { InvalidBytesLengthError } from "../BrandedBytes/errors.js";
import * as BrandedBytes from "../BrandedBytes/index.js";

/**
 * Create Bytes1 from hex string with size validation
 *
 * @param {string} hex - Hex string (must be exactly 2 hex chars + 0x prefix)
 * @returns {import('./BrandedBytes1.js').BrandedBytes1} Bytes1
 * @throws {InvalidBytesLengthError} If length is not 1 byte
 *
 * @example
 * ```typescript
 * const bytes = Bytes1.fromHex("0x12");
 * ```
 */
export function fromHex(hex) {
	const bytes = BrandedBytes.fromHex(hex);
	if (bytes.length !== 1) {
		throw new InvalidBytesLengthError("Bytes1 must be exactly 1 byte", {
			expected: 1,
			actual: bytes.length,
		});
	}
	return /** @type {import('./BrandedBytes1.js').BrandedBytes1} */ (bytes);
}
