import { RlpDecodingError } from "./RlpError.js";

/**
 * Checks if RLP-encoded data represents a list
 *
 * @see https://voltaire.tevm.sh/primitives/rlp for RLP documentation
 * @since 0.0.0
 * @param {Uint8Array} data - RLP-encoded data
 * @returns {boolean} True if data encodes a list
 * @throws {RlpDecodingError} If data is empty
 * @example
 * ```javascript
 * import * as Rlp from './primitives/Rlp/index.js';
 * const list = new Uint8Array([0xc3, 0x01, 0x02, 0x03]);
 * Rlp.isList(list);
 * // => true
 *
 * const bytes = new Uint8Array([0x83, 0x01, 0x02, 0x03]);
 * Rlp.isList(bytes);
 * // => false
 * ```
 */
export function isList(data) {
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

	// List prefixes are [0xc0, 0xff]
	return prefix >= 0xc0;
}
