import { encode } from "./encode.js";

/**
 * @typedef {Uint8Array | import('./BrandedRlp.js').BrandedRlp | Array<any>} Encodable
 */

/**
 * Encodes an object (key-value pairs) to RLP format
 * Converts object to array of [key, value] pairs and encodes
 *
 * @param {Record<string, Encodable>} obj - Object to encode
 * @returns {Uint8Array} RLP-encoded bytes
 *
 * @example
 * ```javascript
 * const obj = {
 *   name: new Uint8Array([65, 66, 67]),
 *   age: new Uint8Array([25])
 * };
 * const encoded = Rlp.encodeObject(obj);
 * ```
 */
export function encodeObject(obj) {
	const encoder = new TextEncoder();
	const entries = Object.entries(obj).map(([key, value]) => [
		encoder.encode(key),
		value,
	]);
	return encode(entries);
}
