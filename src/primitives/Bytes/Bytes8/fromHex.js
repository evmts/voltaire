import * as BytesType from "../Bytes.index.js";
import { InvalidBytesLengthError } from "../errors.js";

/**
 * @param {string} hex
 * @returns {import('./Bytes8Type.js').Bytes8Type}
 */
export function fromHex(hex) {
	const bytes = BytesType.fromHex(hex);
	if (bytes.length !== 8) {
		throw new InvalidBytesLengthError("Bytes8 must be exactly 8 bytes", {
			expected: 8,
			actual: bytes.length,
		});
	}
	return /** @type {import('./Bytes8Type.js').Bytes8Type} */ (
		/** @type {unknown} */ (bytes)
	);
}
