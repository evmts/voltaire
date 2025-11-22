import { InvalidBytesLengthError } from "../errors.js";
import * as BytesType from "../BytesType.js";

export function from(value) {
	const bytes = BytesType.from(value);
	if (bytes.length !== 8) {
		throw new InvalidBytesLengthError("Bytes8 must be exactly 8 bytes", {
			expected: 8,
			actual: bytes.length,
		});
	}
	return bytes;
}
