import * as BytesType from "../Bytes.index.js";
import { InvalidBytesLengthError } from "../errors.js";

/**
 * @param {import('../../Hex/HexType.js').HexType} hex
 * @returns {import('./Bytes2Type.js').Bytes2Type}
 */
export function fromHex(hex) {
	const bytes = BytesType.fromHex(hex);
	if (bytes.length !== 2) {
		throw new InvalidBytesLengthError("Bytes2 must be exactly 2 bytes", {
			expected: 2,
			actual: bytes.length,
		});
	}
	return /** @type {import('./Bytes2Type.js').Bytes2Type} */ (/** @type {unknown} */ (bytes));
}
