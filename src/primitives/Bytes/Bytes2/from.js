import { InvalidBytesLengthError } from "../errors.js";
import * as BytesType from "../BytesType.js";

export function from(value) {
	const bytes = BytesType.from(value);
	if (bytes.length !== 2) {
		throw new InvalidBytesLengthError("Bytes2 must be exactly 2 bytes", {
			expected: 2,
			actual: bytes.length,
		});
	}
	return bytes;
}
