import { Error } from "./errors.js";

/**
 * Checks if RLP-encoded data represents a string (byte array)
 *
 * @param {Uint8Array} data - RLP-encoded data
 * @returns {boolean} True if data encodes a string
 *
 * @example
 * ```javascript
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
		throw new Error("InputTooShort", "Cannot check empty data");
	}

	const prefix = data[0];
	if (prefix === undefined) {
		throw new Error("InputTooShort", "Cannot check empty data");
	}

	// String prefixes are [0x00, 0xbf]
	return prefix < 0xc0;
}
