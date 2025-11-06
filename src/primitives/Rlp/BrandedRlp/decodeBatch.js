import { decode } from "./decode.js";
import { toRaw } from "./toRaw.js";

/**
 * Decodes multiple RLP-encoded items
 *
 * @param {Uint8Array[]} data - Array of RLP-encoded data
 * @returns {any[][]} Array of decoded results
 *
 * @example
 * ```javascript
 * const items = [
 *   Rlp.encode([new Uint8Array([1, 2])]),
 *   Rlp.encode([new Uint8Array([3, 4])])
 * ];
 * const decoded = Rlp.decodeBatch(items);
 * // => [[Uint8Array([1, 2])], [Uint8Array([3, 4])]]
 * ```
 */
export function decodeBatch(data) {
	return data.map((item) => {
		const decoded = decode(item);
		const raw = toRaw(decoded.data);
		return Array.isArray(raw) ? raw : [raw];
	});
}
