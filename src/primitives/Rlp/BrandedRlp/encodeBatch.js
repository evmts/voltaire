import { encode } from "./encode.js";

/**
 * @typedef {Uint8Array | import('./BrandedRlp.js').BrandedRlp | Array<any>} Encodable
 */

/**
 * Encodes multiple items efficiently
 *
 * @param {Encodable[][]} items - Array of items to encode
 * @returns {Uint8Array[]} Array of RLP-encoded results
 *
 * @example
 * ```javascript
 * const items = [
 *   [new Uint8Array([1, 2]), new Uint8Array([3, 4])],
 *   [new Uint8Array([5, 6]), new Uint8Array([7, 8])]
 * ];
 * const encoded = Rlp.encodeBatch(items);
 * // => [Uint8Array(...), Uint8Array(...)]
 * ```
 */
export function encodeBatch(items) {
	return items.map((item) => encode(item));
}
