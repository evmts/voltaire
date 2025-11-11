import { encode } from "./encode.js";

/**
 * @typedef {Uint8Array | import('./BrandedRlp.js').BrandedRlp | Array<any>} Encodable
 */

/**
 * Encodes an array of values to RLP format
 *
 * @see https://voltaire.tevm.sh/primitives/rlp for RLP documentation
 * @since 0.0.0
 * @param {Encodable[]} items - Array of values to encode
 * @returns {Uint8Array} RLP-encoded bytes
 * @throws {Error} If encoding fails
 * @example
 * ```javascript
 * import * as Rlp from './primitives/Rlp/index.js';
 * const items = [
 *   new Uint8Array([1, 2, 3]),
 *   new Uint8Array([4, 5, 6])
 * ];
 * const encoded = Rlp.encodeArray(items);
 * ```
 */
export function encodeArray(items) {
	return encode(items);
}
