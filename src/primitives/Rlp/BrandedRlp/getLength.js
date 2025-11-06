import { decodeLengthValue } from "./utils.js";
import { Error } from "./errors.js";

/**
 * Gets the total length of an RLP item (prefix + payload)
 *
 * @param {Uint8Array} data - RLP-encoded data
 * @returns {number} Total length in bytes
 *
 * @example
 * ```javascript
 * const encoded = new Uint8Array([0x83, 1, 2, 3]);
 * const length = Rlp.getLength(encoded);
 * // => 4 (1 byte prefix + 3 bytes payload)
 * ```
 */
export function getLength(data) {
	if (data.length === 0) {
		throw new Error("InputTooShort", "Cannot get length of empty data");
	}

	const prefix = data[0];
	if (prefix === undefined) {
		throw new Error("InputTooShort", "Cannot get length of empty data");
	}

	// Single byte [0x00, 0x7f]
	if (prefix <= 0x7f) {
		return 1;
	}

	// Short string [0x80, 0xb7]
	if (prefix <= 0xb7) {
		const length = prefix - 0x80;
		return 1 + length;
	}

	// Long string [0xb8, 0xbf]
	if (prefix <= 0xbf) {
		const lengthOfLength = prefix - 0xb7;
		if (data.length < 1 + lengthOfLength) {
			throw new Error("InputTooShort", "Insufficient data for length prefix");
		}
		const length = decodeLengthValue(data.slice(1, 1 + lengthOfLength));
		return 1 + lengthOfLength + length;
	}

	// Short list [0xc0, 0xf7]
	if (prefix <= 0xf7) {
		const length = prefix - 0xc0;
		return 1 + length;
	}

	// Long list [0xf8, 0xff]
	if (prefix <= 0xff) {
		const lengthOfLength = prefix - 0xf7;
		if (data.length < 1 + lengthOfLength) {
			throw new Error("InputTooShort", "Insufficient data for length prefix");
		}
		const length = decodeLengthValue(data.slice(1, 1 + lengthOfLength));
		return 1 + lengthOfLength + length;
	}

	throw new Error(
		"UnexpectedInput",
		`Invalid RLP prefix: 0x${prefix.toString(16)}`,
	);
}
