import * as BytesType from "../Bytes.index.js";
import { InvalidBytesLengthError } from "../errors.js";

/**
 * @param {import('../../Hex/HexType.js').HexType} hex
 * @returns {import('./Bytes4Type.js').Bytes4Type}
 */
export function fromHex(hex) {
	const bytes = BytesType.fromHex(hex);
	if (bytes.length !== 4) {
		throw new InvalidBytesLengthError("Bytes4 must be exactly 4 bytes", {
			expected: 4,
			actual: bytes.length,
		});
	}
	return /** @type {import('./Bytes4Type.js').Bytes4Type} */ (
		/** @type {unknown} */ (bytes)
	);
}
