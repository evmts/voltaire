import { InvalidBytesLengthError } from "../BrandedBytes/errors.js";
import * as BrandedBytes from "../BrandedBytes/index.js";

export function fromHex(hex) {
	const bytes = BrandedBytes.fromHex(hex);
	if (bytes.length !== 6) {
		throw new InvalidBytesLengthError("Bytes6 must be exactly 6 bytes", {
			expected: 6,
			actual: bytes.length,
		});
	}
	return bytes;
}
