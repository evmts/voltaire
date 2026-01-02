import * as BytesType from "../Bytes.index.js";
import { InvalidBytesLengthError } from "../errors.js";

/**
 * @param {Uint8Array | string} value
 * @returns {import('./Bytes8Type.js').Bytes8Type}
 */
export function from(value) {
	const bytes = BytesType.from(value);
	if (bytes.length !== 8) {
		throw new InvalidBytesLengthError("Bytes8 must be exactly 8 bytes", {
			expected: "8 bytes",
			context: { actual: bytes.length },
		});
	}
	return /** @type {import('./Bytes8Type.js').Bytes8Type} */ (
		/** @type {unknown} */ (bytes)
	);
}
