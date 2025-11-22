import { InvalidBytesLengthError } from "../errors.js";
import * as BytesType from "../BytesType.js";

export function from(value) {
	const bytes = BytesType.from(value);
	if (bytes.length !== 5) {
		throw new InvalidBytesLengthError("Bytes5 must be exactly 5 bytes", {
			expected: 5,
			actual: bytes.length,
		});
	}
	return bytes;
}
