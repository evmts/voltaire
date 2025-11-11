import { encode } from "./encode.js";

/**
 * @typedef {Uint8Array | import('./BrandedRlp.js').BrandedRlp | Array<any>} Encodable
 */

/**
 * Encodes a variadic list of items to RLP format
 *
 * @see https://voltaire.tevm.sh/primitives/rlp for RLP documentation
 * @since 0.0.0
 * @param {...Encodable} items - Items to encode
 * @returns {Uint8Array} RLP-encoded bytes
 * @throws {Error} If encoding fails
 * @example
 * ```javascript
 * import * as Rlp from './primitives/Rlp/index.js';
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
