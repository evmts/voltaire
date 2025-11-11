import * as OxRlp from "ox/Rlp";

/**
 * Encodes a list of RLP-encodable items
 *
 * @see https://voltaire.tevm.sh/primitives/rlp for RLP documentation
 * @since 0.0.0
 * @param {Array<Uint8Array | import('./BrandedRlp.js').BrandedRlp | any[]>} items - Array of items to encode
 * @returns {Uint8Array} RLP-encoded list
 * @throws {Error} If encoding fails
 * @example
 * ```javascript
 * import * as Rlp from './primitives/Rlp/index.js';
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
 */
export function encodeList(items) {
	return OxRlp.from(/** @type {any} */ (items), { as: "Bytes" });
}
