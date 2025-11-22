import { InvalidBytesLengthError } from "../errors.js";
import * as BytesType from "../Bytes.index.js";

/**
 * Create Bytes1 from various input types with size validation
 *
 * @param {Uint8Array | string} value - Uint8Array, hex string, or UTF-8 string (must be exactly 1 byte)
 * @returns {import('./Bytes1Type.js').Bytes1Type} Bytes1
 * @throws {InvalidBytesLengthError} If length is not 1 byte
 *
 * @example
 * ```typescript
 * const b1 = Bytes1.from(new Uint8Array([0x12]));
 * const b2 = Bytes1.from("0x12");
 * ```
 */
export function from(value) {
	const bytes = BytesType.from(value);
	if (bytes.length !== 1) {
		throw new InvalidBytesLengthError("Bytes1 must be exactly 1 byte", {
			expected: 1,
			actual: bytes.length,
		});
	}
	return /** @type {import('./Bytes1Type.js').Bytes1Type} */ (bytes);
}
