import { InvalidBytesLengthError } from "../BrandedBytes/errors.js";
import * as BrandedBytes from "../BrandedBytes/index.js";

export function from(value) {
	const bytes = BrandedBytes.from(value);
	if (bytes.length !== 3) {
		throw new InvalidBytesLengthError("Bytes3 must be exactly 3 bytes", {
			expected: 3,
			actual: bytes.length,
		});
	}
	return bytes;
}
