import * as BytesType from "../Bytes.index.js";
import { InvalidBytesLengthError } from "../errors.js";

/**
 * @param {import('../../Hex/HexType.js').HexType} hex
 * @returns {import('./Bytes6Type.js').Bytes6Type}
 */
export function fromHex(hex) {
	const bytes = BytesType.fromHex(hex);
	if (bytes.length !== 6) {
		throw new InvalidBytesLengthError("Bytes6 must be exactly 6 bytes", {
			expected: 6,
			actual: bytes.length,
		});
	}
	return /** @type {import('./Bytes6Type.js').Bytes6Type} */ (
		/** @type {unknown} */ (bytes)
	);
}
