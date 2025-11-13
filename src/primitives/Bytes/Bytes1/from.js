import { InvalidBytesLengthError } from "../BrandedBytes/errors.js";
import * as BrandedBytes from "../BrandedBytes/index.js";

/**
 * Create Bytes1 from various input types with size validation
 *
 * @param {Uint8Array | string} value - Uint8Array, hex string, or UTF-8 string (must be exactly 1 byte)
 * @returns {import('./BrandedBytes1.js').BrandedBytes1} Bytes1
 * @throws {InvalidBytesLengthError} If length is not 1 byte
 *
 * @example
 * ```typescript
 * const b1 = Bytes1.from(new Uint8Array([0x12]));
 * const b2 = Bytes1.from("0x12");
 * ```
 */
export function from(value) {
	const bytes = BrandedBytes.from(value);
	if (bytes.length !== 1) {
		throw new InvalidBytesLengthError("Bytes1 must be exactly 1 byte", {
			expected: 1,
			actual: bytes.length,
		});
	}
	return /** @type {import('./BrandedBytes1.js').BrandedBytes1} */ (bytes);
}
