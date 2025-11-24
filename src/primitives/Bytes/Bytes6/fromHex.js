import * as BytesType from "../Bytes.index.js";
import { InvalidBytesLengthError } from "../errors.js";

export function fromHex(hex) {
	const bytes = BytesType.fromHex(hex);
	if (bytes.length !== 6) {
		throw new InvalidBytesLengthError("Bytes6 must be exactly 6 bytes", {
			expected: 6,
			actual: bytes.length,
		});
	}
	return bytes;
}
