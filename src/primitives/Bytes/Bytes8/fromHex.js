import { InvalidBytesLengthError } from "../BrandedBytes/errors.js";
import * as BrandedBytes from "../BrandedBytes/index.js";

export function fromHex(hex) {
	const bytes = BrandedBytes.fromHex(hex);
	if (bytes.length !== 8) {
		throw new InvalidBytesLengthError("Bytes8 must be exactly 8 bytes", {
			expected: 8,
			actual: bytes.length,
		});
	}
	return bytes;
}
