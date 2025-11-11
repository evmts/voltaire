import { RlpDecodingError } from "./RlpError.js";

/**
 * Checks if RLP-encoded data represents a string (byte array)
 *
 * @see https://voltaire.tevm.sh/primitives/rlp for RLP documentation
 * @since 0.0.0
 * @param {Uint8Array} data - RLP-encoded data
 * @returns {boolean} True if data encodes a string
 * @throws {RlpDecodingError} If data is empty
 * @example
 * ```javascript
 * import * as Rlp from './primitives/Rlp/index.js';
 * const bytes = new Uint8Array([0x83, 0x01, 0x02, 0x03]);
 * Rlp.isString(bytes);
 * // => true
 *
 * const list = new Uint8Array([0xc3, 0x01, 0x02, 0x03]);
 * Rlp.isString(list);
 * // => false
 * ```
 */
export function isString(data) {
	if (data.length === 0) {
		throw new RlpDecodingError("Cannot check empty data", {
			code: "RLP_INPUT_TOO_SHORT",
		});
	}

	const prefix = data[0];
	if (prefix === undefined) {
		throw new RlpDecodingError("Cannot check empty data", {
			code: "RLP_INPUT_TOO_SHORT",
		});
	}

	// String prefixes are [0x00, 0xbf]
	return prefix < 0xc0;
}
