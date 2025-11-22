import { InvalidBytesLengthError } from "../errors.js";
import * as BytesType from "../BytesType.js";

export function from(value) {
	const bytes = BytesType.from(value);
	if (bytes.length !== 3) {
		throw new InvalidBytesLengthError("Bytes3 must be exactly 3 bytes", {
			expected: 3,
			actual: bytes.length,
		});
	}
	return bytes;
}
