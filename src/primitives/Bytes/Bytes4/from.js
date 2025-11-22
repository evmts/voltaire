import { InvalidBytesLengthError } from "../errors.js";
import * as BytesType from "../Bytes.index.js";

export function from(value) {
	const bytes = BytesType.from(value);
	if (bytes.length !== 4) {
		throw new InvalidBytesLengthError("Bytes4 must be exactly 4 bytes", {
			expected: 4,
			actual: bytes.length,
		});
	}
	return bytes;
}
