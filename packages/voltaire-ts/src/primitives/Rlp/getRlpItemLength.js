import { MAX_DEPTH } from "./constants.js";
import { RlpDecodingError } from "./RlpError.js";

/**
 * Read a long-form length (big-endian, `lengthOfLength` bytes after the
 * prefix) and reject non-canonical forms.
 * @internal
 * @param {Uint8Array} bytes
 * @param {number} offset - Offset of the item prefix
 * @param {number} end - Exclusive bound the item must fit in
 * @param {number} lengthOfLength
 * @param {"String" | "List"} kind
 * @returns {number}
 */
function readLongLength(bytes, offset, end, lengthOfLength, kind) {
	const available = end - offset;
	if (available < 1 + lengthOfLength) {
		throw new RlpDecodingError(
			`Expected ${1 + lengthOfLength} bytes for length, got ${available}`,
			{
				code: "RLP_INPUT_TOO_SHORT",
				context: { expected: 1 + lengthOfLength, actual: available, offset },
			},
		);
	}

	if (bytes[offset + 1] === 0) {
		throw new RlpDecodingError("Length encoding has leading zeros", {
			code: "RLP_LEADING_ZEROS",
			context: { prefix: bytes[offset], offset },
		});
	}

	let length = 0;
	for (let i = 0; i < lengthOfLength; i++) {
		length = length * 256 + /** @type {number} */ (bytes[offset + 1 + i]);
	}

	if (length < 56) {
		throw new RlpDecodingError(`${kind} < 56 bytes should use short form`, {
			code: "RLP_NON_CANONICAL_SIZE",
			context: { length, prefix: bytes[offset], offset },
		});
	}
	return length;
}

/**
 * Validate one RLP item in `bytes[offset, end)` and every item nested in it.
 * Returns the encoded length of the item.
 * @internal
 * @param {Uint8Array} bytes
 * @param {number} offset
 * @param {number} end
 * @param {number} depth
 * @returns {number}
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: one branch per RLP prefix range
function validateItem(bytes, offset, end, depth) {
	if (depth >= MAX_DEPTH) {
		throw new RlpDecodingError(
			`Maximum recursion depth ${MAX_DEPTH} exceeded`,
			{
				code: "RLP_RECURSION_DEPTH_EXCEEDED",
				context: { depth, maxDepth: MAX_DEPTH },
			},
		);
	}

	const available = end - offset;
	const prefix = bytes[offset];
	if (available <= 0 || prefix === undefined) {
		throw new RlpDecodingError("Cannot decode empty input", {
			code: "RLP_INPUT_TOO_SHORT",
			context: { offset },
		});
	}

	// Single byte [0x00, 0x7f]
	if (prefix <= 0x7f) {
		return 1;
	}

	/** @type {number} */
	let headerLength;
	/** @type {number} */
	let payloadLength;

	if (prefix <= 0xb7) {
		// Short string [0x80, 0xb7]
		headerLength = 1;
		payloadLength = prefix - 0x80;
		if (payloadLength === 1 && available > 1) {
			const nextByte = /** @type {number} */ (bytes[offset + 1]);
			if (nextByte < 0x80) {
				throw new RlpDecodingError(
					"Single byte < 0x80 should not be prefixed",
					{
						code: "RLP_NON_CANONICAL_SIZE",
						context: { prefix, nextByte, offset },
					},
				);
			}
		}
	} else if (prefix <= 0xbf) {
		// Long string [0xb8, 0xbf]
		headerLength = 1 + (prefix - 0xb7);
		payloadLength = readLongLength(bytes, offset, end, prefix - 0xb7, "String");
	} else if (prefix <= 0xf7) {
		// Short list [0xc0, 0xf7]
		headerLength = 1;
		payloadLength = prefix - 0xc0;
	} else {
		// Long list [0xf8, 0xff]
		headerLength = 1 + (prefix - 0xf7);
		payloadLength = readLongLength(bytes, offset, end, prefix - 0xf7, "List");
	}

	const total = headerLength + payloadLength;
	if (available < total) {
		throw new RlpDecodingError(`Expected ${total} bytes, got ${available}`, {
			code: "RLP_INPUT_TOO_SHORT",
			context: { expected: total, actual: available, offset },
		});
	}

	if (prefix >= 0xc0) {
		// Children must tile the list payload exactly. Each child is bounded by
		// the payload end, so a child that overruns its parent is rejected.
		const payloadEnd = offset + total;
		let child = offset + headerLength;
		while (child < payloadEnd) {
			child += validateItem(bytes, child, payloadEnd, depth + 1);
		}
	}

	return total;
}

/**
 * Calculate the total length of the first RLP-encoded item in `bytes` and
 * validate canonical encoding of that item and of every item nested in it.
 *
 * Rejects, at any depth: a prefixed single byte below 0x80, long form for a
 * payload under 56 bytes, a length with a leading zero byte, an item that
 * overruns its parent list, and nesting deeper than MAX_DEPTH.
 *
 * @internal
 * @param {Uint8Array} bytes
 * @returns {number}
 * @throws {RlpDecodingError} If the item is truncated, non-canonical, or too deep
 */
export function getRlpItemLength(bytes) {
	if (bytes.length === 0) {
		throw new RlpDecodingError("Cannot decode empty input", {
			code: "RLP_INPUT_TOO_SHORT",
		});
	}
	return validateItem(bytes, 0, bytes.length, 0);
}
