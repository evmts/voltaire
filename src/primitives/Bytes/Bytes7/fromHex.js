import { InvalidBytesLengthError } from "../BrandedBytes/errors.js";
import * as BrandedBytes from "../BrandedBytes/index.js";

export function fromHex(hex) {
	const bytes = BrandedBytes.fromHex(hex);
	if (bytes.length !== 7) {
		throw new InvalidBytesLengthError("Bytes7 must be exactly 7 bytes", {
			expected: 7,
			actual: bytes.length,
		});
	}
	return bytes;
}
