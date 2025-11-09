import * as OxRlp from "ox/Rlp";

/**
 * Encodes a list of RLP-encodable items
 *
 * @param {Array<Uint8Array | import('./BrandedRlp.js').BrandedRlp | any[]>} items - Array of items to encode
 * @returns {Uint8Array} RLP-encoded list
 *
 * @example
 * ```javascript
 * // Empty list
 * const empty = [];
 * const encoded = Rlp.encodeList(empty);
 * // => Uint8Array([0xc0])
 *
 * // Simple list
 * const list = [new Uint8Array([1]), new Uint8Array([2])];
 * const encoded = Rlp.encodeList(list);
 * // => Uint8Array([0xc4, 0x01, 0x02])
 *
 * // Nested list
 * const nested = [new Uint8Array([1]), [new Uint8Array([2])]];
 * const encoded = Rlp.encodeList(nested);
 * ```
 *
 * Rules:
 * - Each item is first RLP-encoded
 * - Calculate total length of all encoded items
 * - If total < 56: [0xc0 + total_length, ...encoded_items]
 * - If total >= 56: [0xf7 + length_of_length, ...length_bytes, ...encoded_items]
 */
export function encodeList(items) {
	return OxRlp.from(items, { as: "Bytes" });
}
