import * as BytesType from "../Bytes.index.js";
import { InvalidBytesLengthError } from "../errors.js";

export function fromHex(hex) {
	const bytes = BytesType.fromHex(hex);
	if (bytes.length !== 3) {
		throw new InvalidBytesLengthError("Bytes3 must be exactly 3 bytes", {
			expected: 3,
			actual: bytes.length,
		});
	}
	return bytes;
}
