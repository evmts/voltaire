import * as BytesType from "../Bytes.index.js";
import { InvalidBytesLengthError } from "../errors.js";

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
