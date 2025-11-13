import { InvalidBytesLengthError } from "../BrandedBytes/errors.js";
import * as BrandedBytes from "../BrandedBytes/index.js";

export function fromHex(hex) {
	const bytes = BrandedBytes.fromHex(hex);
	if (bytes.length !== 5) {
		throw new InvalidBytesLengthError("Bytes5 must be exactly 5 bytes", {
			expected: 5,
			actual: bytes.length,
		});
	}
	return bytes;
}
