import { decode } from "./decode.js";
import { toRaw } from "./toRaw.js";

/**
 * Decodes multiple RLP-encoded items
 *
 * @see https://voltaire.tevm.sh/primitives/rlp for RLP documentation
 * @since 0.0.0
 * @param {Uint8Array[]} data - Array of RLP-encoded data
 * @returns {any[][]} Array of decoded results
 * @throws {Error} If decoding fails for any item
 * @example
 * ```javascript
 * import * as Rlp from './primitives/Rlp/index.js';
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
