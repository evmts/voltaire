/**
 * Encodes data to RLP format
 *
 * @see https://voltaire.tevm.sh/primitives/rlp for RLP documentation
 * @since 0.0.0
 * @param {Encodable} data - Data to encode (Uint8Array, RlpData, or array)
 * @returns {Uint8Array} RLP-encoded bytes
 * @throws {RlpEncodingError} If data type is invalid or encoding fails
 * @example
 * ```javascript
 * import * as Rlp from './primitives/Rlp/index.js';
 * // Encode bytes
 * const bytes = new Uint8Array([1, 2, 3]);
 * const encoded = Rlp.encode(bytes);
 * // => Uint8Array([0x83, 1, 2, 3])
 *
 * // Encode list
 * const list = [new Uint8Array([1, 2]), new Uint8Array([3, 4])];
 * const encoded = Rlp.encode(list);
 *
 * // Encode nested structures
 * const nested = [new Uint8Array([1]), [new Uint8Array([2]), new Uint8Array([3])]];
 * const encoded = Rlp.encode(nested);
 * ```
 */
export function encode(data: Encodable): Uint8Array;
export type Encodable = Uint8Array | import("./RlpType.js").BrandedRlp | Array<Uint8Array | import("./RlpType.js").BrandedRlp | any>;
//# sourceMappingURL=encode.d.ts.map