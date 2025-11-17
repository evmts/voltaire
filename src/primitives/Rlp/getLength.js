import { RlpDecodingError } from "./RlpError.js";
import { decodeLengthValue } from "./utils.js";

/**
 * Gets the total length of an RLP item (prefix + payload)
 *
 * @see https://voltaire.tevm.sh/primitives/rlp for RLP documentation
 * @since 0.0.0
 * @param {Uint8Array} data - RLP-encoded data
 * @returns {number} Total length in bytes
 * @throws {RlpDecodingError} If data is empty, too short, or has invalid prefix
 * @example
 * ```javascript
 * import * as Rlp from './primitives/Rlp/index.js';
 * const encoded = new Uint8Array([0x83, 1, 2, 3]);
 * const length = Rlp.getLength(encoded);
 * // => 4 (1 byte prefix + 3 bytes payload)
 * ```
 */
export function getLength(data) {
	if (data.length === 0) {
		throw new RlpDecodingError("Cannot get length of empty data", {
			code: "RLP_INPUT_TOO_SHORT",
		});
	}

	const prefix = data[0];
	if (prefix === undefined) {
		throw new RlpDecodingError("Cannot get length of empty data", {
			code: "RLP_INPUT_TOO_SHORT",
		});
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
			throw new RlpDecodingError("Insufficient data for length prefix", {
				code: "RLP_INPUT_TOO_SHORT",
				context: { expected: 1 + lengthOfLength, actual: data.length },
			});
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
			throw new RlpDecodingError("Insufficient data for length prefix", {
				code: "RLP_INPUT_TOO_SHORT",
				context: { expected: 1 + lengthOfLength, actual: data.length },
			});
		}
		const length = decodeLengthValue(data.slice(1, 1 + lengthOfLength));
		return 1 + lengthOfLength + length;
	}

	throw new RlpDecodingError(`Invalid RLP prefix: 0x${prefix.toString(16)}`, {
		code: "RLP_INVALID_PREFIX",
		context: { prefix },
	});
}
