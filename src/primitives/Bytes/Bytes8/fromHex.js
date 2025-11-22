import { InvalidBytesLengthError } from "../errors.js";
import * as BytesType from "../Bytes.index.js";

export function fromHex(hex) {
	const bytes = BytesType.fromHex(hex);
	if (bytes.length !== 8) {
		throw new InvalidBytesLengthError("Bytes8 must be exactly 8 bytes", {
			expected: 8,
			actual: bytes.length,
		});
	}
	return bytes;
}
