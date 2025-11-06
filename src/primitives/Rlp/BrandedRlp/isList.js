import { Error } from "./errors.js";

/**
 * Checks if RLP-encoded data represents a list
 *
 * @param {Uint8Array} data - RLP-encoded data
 * @returns {boolean} True if data encodes a list
 *
 * @example
 * ```javascript
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
		throw new Error("InputTooShort", "Cannot check empty data");
	}

	const prefix = data[0];
	if (prefix === undefined) {
		throw new Error("InputTooShort", "Cannot check empty data");
	}

	// List prefixes are [0xc0, 0xff]
	return prefix >= 0xc0;
}
