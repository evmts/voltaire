import type { Encodable } from "./Rlp.js";
import { encode } from "./encode.js";
import { encodeLengthValue } from "./utils.js";

/**
 * Encodes a list of RLP-encodable items (this: pattern)
 *
 * @param this - Array of items to encode
 * @returns RLP-encoded list
 *
 * @example
 * ```typescript
 * // Empty list
 * const empty = [];
 * const encoded = Rlp.encodeList.call(empty);
 * // => Uint8Array([0xc0])
 *
 * // Simple list
 * const list = [new Uint8Array([1]), new Uint8Array([2])];
 * const encoded = Rlp.encodeList.call(list);
 * // => Uint8Array([0xc4, 0x01, 0x02])
 *
 * // Nested list
 * const nested = [new Uint8Array([1]), [new Uint8Array([2])]];
 * const encoded = Rlp.encodeList.call(nested);
 * ```
 *
 * Rules:
 * - Each item is first RLP-encoded
 * - Calculate total length of all encoded items
 * - If total < 56: [0xc0 + total_length, ...encoded_items]
 * - If total >= 56: [0xf7 + length_of_length, ...length_bytes, ...encoded_items]
 */
export function encodeList(this: Encodable[]): Uint8Array {
	// Encode each item
	const encodedItems = this.map((item) => encode.call(item));

	// Calculate total length
	const totalLength = encodedItems.reduce((sum, item) => sum + item.length, 0);

	// Short list (total payload < 56 bytes)
	if (totalLength < 56) {
		const result = new Uint8Array(1 + totalLength);
		result[0] = 0xc0 + totalLength;
		let offset = 1;
		for (const item of encodedItems) {
			result.set(item, offset);
			offset += item.length;
		}
		return result;
	}

	// Long list (total payload >= 56 bytes)
	const lengthBytes = encodeLengthValue(totalLength);
	const result = new Uint8Array(1 + lengthBytes.length + totalLength);
	result[0] = 0xf7 + lengthBytes.length;
	result.set(lengthBytes, 1);
	let offset = 1 + lengthBytes.length;
	for (const item of encodedItems) {
		result.set(item, offset);
		offset += item.length;
	}
	return result;
}
