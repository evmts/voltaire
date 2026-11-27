import { encodeBytes } from "./encodeBytes.js";
import { isData } from "./isData.js";
import { RlpEncodingError } from "./RlpError.js";

/**
 * Encode a positive integer length as minimal big-endian bytes
 * @internal
 * @param {number} length
 * @returns {Uint8Array}
 */
function encodeLength(length) {
	/** @type {number[]} */
	const lenBytes = [];
	let n = length;
	while (n > 0) {
		lenBytes.unshift(n & 0xff);
		n = Math.floor(n / 256);
	}
	return new Uint8Array(lenBytes);
}

/**
 * Encode a single RLP-encodable item
 * @internal
 * @param {import('./RlpType.js').Encodable} item
 * @returns {Uint8Array}
 */
function encodeItem(item) {
	if (item instanceof Uint8Array) {
		return encodeBytes(item);
	}
	if (Array.isArray(item)) {
		return encodeList(item);
	}
	if (isData(item)) {
		return item.type === "bytes"
			? encodeBytes(item.value)
			: encodeList(item.value);
	}
	throw new RlpEncodingError("Invalid encodable data type", {
		code: "RLP_INVALID_TYPE",
		context: { type: typeof item },
	});
}

/**
 * Encodes a list of RLP-encodable items
 *
 * @see https://voltaire.tevm.sh/primitives/rlp for RLP documentation
 * @since 0.0.0
 * @param {Array<import('./RlpType.js').Encodable>} items - Array of items to encode
 * @returns {Uint8Array} RLP-encoded list
 * @throws {import('./RlpError.js').RlpEncodingError} If encoding fails
 * @example
 * ```javascript
 * import * as Rlp from './primitives/Rlp/index.js';
 * // Empty list
 * const empty = [];
 * const encoded = Rlp.encodeList(empty);
 * // => Uint8Array([0xc0])
 *
 * // Simple list
 * const list = [new Uint8Array([1]), new Uint8Array([2])];
 * const encoded = Rlp.encodeList(list);
 * // => Uint8Array([0xc2, 0x01, 0x02])
 *
 * // Nested list
 * const nested = [new Uint8Array([1]), [new Uint8Array([2])]];
 * const encoded = Rlp.encodeList(nested);
 * ```
 */
export function encodeList(items) {
	if (!Array.isArray(items)) {
		throw new RlpEncodingError("Expected array for encodeList", {
			code: "RLP_INVALID_TYPE",
			context: { type: typeof items },
		});
	}

	/** @type {Uint8Array[]} */
	const encodedItems = [];
	let totalLength = 0;

	for (let i = 0; i < items.length; i++) {
		const encoded = encodeItem(
			/** @type {import('./RlpType.js').Encodable} */ (items[i]),
		);
		encodedItems.push(encoded);
		totalLength += encoded.length;
	}

	/** @type {Uint8Array} */
	let out;
	let offset = 0;

	if (totalLength <= 55) {
		out = new Uint8Array(1 + totalLength);
		out[0] = 0xc0 + totalLength;
		offset = 1;
	} else {
		const lenBytes = encodeLength(totalLength);
		out = new Uint8Array(1 + lenBytes.length + totalLength);
		out[0] = 0xf7 + lenBytes.length;
		out.set(lenBytes, 1);
		offset = 1 + lenBytes.length;
	}

	for (let i = 0; i < encodedItems.length; i++) {
		const part = /** @type {Uint8Array} */ (encodedItems[i]);
		out.set(part, offset);
		offset += part.length;
	}

	return out;
}
