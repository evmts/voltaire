import { InvalidBytesLengthError } from "../errors.js";
import * as BytesType from "../BytesType.js";

export function fromHex(hex) {
	const bytes = BytesType.fromHex(hex);
	if (bytes.length !== 7) {
		throw new InvalidBytesLengthError("Bytes7 must be exactly 7 bytes", {
			expected: 7,
			actual: bytes.length,
		});
	}
	return bytes;
}
