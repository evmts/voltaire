import { getRlpItemLength } from "./getRlpItemLength.js";
import { RlpDecodingError } from "./RlpError.js";

/**
 * @typedef {{
 *   data: import('./RlpType.js').BrandedRlp;
 *   remainder: Uint8Array;
 * }} Decoded
 */

/**
 * Read big-endian unsigned integer length of `lengthOfLength` bytes
 * @internal
 * @param {Uint8Array} bytes
 * @param {number} offset
 * @param {number} lengthOfLength
 * @returns {number}
 */
function readLength(bytes, offset, lengthOfLength) {
	let length = 0;
	for (let i = 0; i < lengthOfLength; i++) {
		length = length * 256 + /** @type {number} */ (bytes[offset + i]);
	}
	return length;
}

/**
 * Decode a pre-validated RLP item starting at `offset`
 * @internal
 * @param {Uint8Array} bytes
 * @param {number} offset
 * @returns {{ data: import('./RlpType.js').BrandedRlp; nextOffset: number }}
 */
function decodeValidated(bytes, offset) {
	const prefix = /** @type {number} */ (bytes[offset]);

	if (prefix <= 0x7f) {
		return {
			data: { type: "bytes", value: bytes.slice(offset, offset + 1) },
			nextOffset: offset + 1,
		};
	}

	if (prefix <= 0xb7) {
		const len = prefix - 0x80;
		const start = offset + 1;
		return {
			data: { type: "bytes", value: bytes.slice(start, start + len) },
			nextOffset: start + len,
		};
	}

	if (prefix <= 0xbf) {
		const lenOfLen = prefix - 0xb7;
		const len = readLength(bytes, offset + 1, lenOfLen);
		const start = offset + 1 + lenOfLen;
		return {
			data: { type: "bytes", value: bytes.slice(start, start + len) },
			nextOffset: start + len,
		};
	}

	const headerLen = prefix <= 0xf7 ? 1 : 1 + (prefix - 0xf7);
	const payloadLen =
		prefix <= 0xf7
			? prefix - 0xc0
			: readLength(bytes, offset + 1, prefix - 0xf7);
	const start = offset + headerLen;
	const end = start + payloadLen;

	/** @type {import('./RlpType.js').BrandedRlp[]} */
	const items = [];
	let pos = start;
	while (pos < end) {
		const decoded = decodeValidated(bytes, pos);
		items.push(decoded.data);
		pos = decoded.nextOffset;
	}

	return {
		data: { type: "list", value: items },
		nextOffset: end,
	};
}

/**
 * Decodes RLP-encoded bytes
 *
 * @see https://voltaire.tevm.sh/primitives/rlp for RLP documentation
 * @since 0.0.0
 * @param {Uint8Array} bytes - RLP-encoded data
 * @param {boolean} [stream=false] - If true, allows extra data after decoded value. If false, expects exact match
 * @returns {Decoded} Decoded RLP data with remainder
 * @throws {RlpDecodingError} If input is too short, invalid, or has unexpected remainder (when stream=false)
 * @example
 * ```javascript
 * import * as Rlp from './primitives/Rlp/index.js';
 * // Decode single value
 * const bytes = new Uint8Array([0x83, 1, 2, 3]);
 * const result = Rlp.decode(bytes);
 * // => { data: { type: 'bytes', value: Uint8Array([1, 2, 3]) }, remainder: Uint8Array([]) }
 *
 * // Stream decoding (multiple values)
 * const stream = new Uint8Array([0x01, 0x02]);
 * const result = Rlp.decode(stream, true);
 * // => { data: { type: 'bytes', value: Uint8Array([1]) }, remainder: Uint8Array([2]) }
 *
 * // Decode list
 * const list = new Uint8Array([0xc3, 0x01, 0x02, 0x03]);
 * const result = Rlp.decode(list);
 * ```
 */
export function decode(bytes, stream = false) {
	if (bytes.length === 0) {
		throw new RlpDecodingError("Cannot decode empty input", {
			code: "RLP_INPUT_TOO_SHORT",
		});
	}

	// Validates canonical framing and bounds of the item and of every
	// nested item before anything is interpreted.
	const itemLength = getRlpItemLength(bytes);
	const remainder = bytes.slice(itemLength);

	if (!stream && remainder.length > 0) {
		throw new RlpDecodingError(
			`Extra data after decoded value: ${remainder.length} bytes`,
			{
				code: "RLP_INVALID_REMAINDER",
				context: { remainderLength: remainder.length },
			},
		);
	}

	const { data } = decodeValidated(bytes, 0);
	return { data, remainder };
}
