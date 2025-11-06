import { encode } from "./encode.js";

/**
 * @typedef {Uint8Array | import('./BrandedRlp.js').BrandedRlp | Array<any>} Encodable
 */

/**
 * Encodes a variadic list of items to RLP format
 *
 * @param {...Encodable} items - Items to encode
 * @returns {Uint8Array} RLP-encoded bytes
 *
 * @example
 * ```javascript
 * const encoded = Rlp.encodeVariadic(
 *   new Uint8Array([1, 2]),
 *   new Uint8Array([3, 4]),
 *   new Uint8Array([5, 6])
 * );
 * ```
 */
export function encodeVariadic(...items) {
	return encode(items);
}
