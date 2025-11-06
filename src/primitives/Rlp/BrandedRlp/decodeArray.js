import { decode } from "./decode.js";
import { toRaw } from "./toRaw.js";

/**
 * Decodes RLP-encoded bytes to an array
 *
 * @param {Uint8Array} data - RLP-encoded data
 * @returns {any[]} Decoded array
 *
 * @example
 * ```javascript
 * const encoded = Rlp.encodeArray([
 *   new Uint8Array([1, 2]),
 *   new Uint8Array([3, 4])
 * ]);
 * const arr = Rlp.decodeArray(encoded);
 * // => [Uint8Array([1, 2]), Uint8Array([3, 4])]
 * ```
 */
export function decodeArray(data) {
	const decoded = decode(data);
	const raw = toRaw(decoded.data);
	return Array.isArray(raw) ? raw : [raw];
}
