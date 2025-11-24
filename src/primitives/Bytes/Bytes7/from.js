import * as BytesType from "../Bytes.index.js";
import { InvalidBytesLengthError } from "../errors.js";

export function from(value) {
	const bytes = BytesType.from(value);
	if (bytes.length !== 7) {
		throw new InvalidBytesLengthError("Bytes7 must be exactly 7 bytes", {
			expected: 7,
			actual: bytes.length,
		});
	}
	return bytes;
}
