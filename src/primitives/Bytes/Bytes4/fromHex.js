import { InvalidBytesLengthError } from "../BrandedBytes/errors.js";
import * as BrandedBytes from "../BrandedBytes/index.js";

export function fromHex(hex) {
	const bytes = BrandedBytes.fromHex(hex);
	if (bytes.length !== 4) {
		throw new InvalidBytesLengthError("Bytes4 must be exactly 4 bytes", {
			expected: 4,
			actual: bytes.length,
		});
	}
	return bytes;
}
