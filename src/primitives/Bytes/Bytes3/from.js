import * as BytesType from "../Bytes.index.js";
import { InvalidBytesLengthError } from "../errors.js";

/**
 * @param {Uint8Array | string} value
 * @returns {import('./Bytes3Type.js').Bytes3Type}
 */
export function from(value) {
	const bytes = BytesType.from(value);
	if (bytes.length !== 3) {
		throw new InvalidBytesLengthError("Bytes3 must be exactly 3 bytes", {
			expected: 3,
			actual: bytes.length,
		});
	}
	return /** @type {import('./Bytes3Type.js').Bytes3Type} */ (
		/** @type {unknown} */ (bytes)
	);
}
