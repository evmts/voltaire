import { InvalidBytesLengthError } from "../BrandedBytes/errors.js";
import * as BrandedBytes from "../BrandedBytes/index.js";

export function from(value) {
	const bytes = BrandedBytes.from(value);
	if (bytes.length !== 2) {
		throw new InvalidBytesLengthError("Bytes2 must be exactly 2 bytes", {
			expected: 2,
			actual: bytes.length,
		});
	}
	return bytes;
}
