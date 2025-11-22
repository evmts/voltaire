import { InvalidBytesLengthError } from "../errors.js";
import * as BytesType from "../Bytes.index.js";

export function from(value) {
	const bytes = BytesType.from(value);
	if (bytes.length !== 6) {
		throw new InvalidBytesLengthError("Bytes6 must be exactly 6 bytes", {
			expected: 6,
			actual: bytes.length,
		});
	}
	return bytes;
}
