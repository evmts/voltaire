import { InvalidBytesLengthError } from "../errors.js";
import * as BytesType from "../Bytes.index.js";

export function fromHex(hex) {
	const bytes = BytesType.fromHex(hex);
	if (bytes.length !== 4) {
		throw new InvalidBytesLengthError("Bytes4 must be exactly 4 bytes", {
			expected: 4,
			actual: bytes.length,
		});
	}
	return bytes;
}
