import * as BytesType from "../Bytes.index.js";
import { InvalidBytesLengthError } from "../errors.js";

/**
 * @param {import('../../Hex/HexType.js').HexType} hex
 * @returns {import('./Bytes7Type.js').Bytes7Type}
 */
export function fromHex(hex) {
	const bytes = BytesType.fromHex(hex);
	if (bytes.length !== 7) {
		throw new InvalidBytesLengthError("Bytes7 must be exactly 7 bytes", {
			expected: 7,
			actual: bytes.length,
		});
	}
	return /** @type {import('./Bytes7Type.js').Bytes7Type} */ (/** @type {unknown} */ (bytes));
}
