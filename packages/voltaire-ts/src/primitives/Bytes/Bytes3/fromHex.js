import * as BytesType from "../Bytes.index.js";
import { InvalidBytesLengthError } from "../errors.js";

/**
 * @param {import('../../Hex/HexType.js').HexType} hex
 * @returns {import('./Bytes3Type.js').Bytes3Type}
 */
export function fromHex(hex) {
	const bytes = BytesType.fromHex(hex);
	if (bytes.length !== 3) {
		throw new InvalidBytesLengthError("Bytes3 must be exactly 3 bytes", {
			expected: "3 bytes",
			context: { actual: bytes.length },
		});
	}
	return /** @type {import('./Bytes3Type.js').Bytes3Type} */ (
		/** @type {unknown} */ (bytes)
	);
}
