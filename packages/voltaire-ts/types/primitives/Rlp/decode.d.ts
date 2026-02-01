/**
 * Decodes RLP-encoded bytes
 *
 * @see https://voltaire.tevm.sh/primitives/rlp for RLP documentation
 * @since 0.0.0
 * @param {Uint8Array} bytes - RLP-encoded data
 * @param {boolean} [stream=false] - If true, allows extra data after decoded value. If false, expects exact match
 * @returns {Decoded} Decoded RLP data with remainder
 * @throws {RlpDecodingError} If input is too short, invalid, or has unexpected remainder (when stream=false)
 * @example
 * ```javascript
 * import * as Rlp from './primitives/Rlp/index.js';
 * // Decode single value
 * const bytes = new Uint8Array([0x83, 1, 2, 3]);
 * const result = Rlp.decode(bytes);
 * // => { data: { type: 'bytes', value: Uint8Array([1, 2, 3]) }, remainder: Uint8Array([]) }
 *
 * // Stream decoding (multiple values)
 * const stream = new Uint8Array([0x01, 0x02]);
 * const result = Rlp.decode(stream, true);
 * // => { data: { type: 'bytes', value: Uint8Array([1]) }, remainder: Uint8Array([2]) }
 *
 * // Decode list
 * const list = new Uint8Array([0xc3, 0x01, 0x02, 0x03]);
 * const result = Rlp.decode(list);
 * ```
 */
export function decode(bytes: Uint8Array, stream?: boolean): Decoded;
export type Decoded = {
    data: import("./RlpType.js").BrandedRlp;
    remainder: Uint8Array;
};
//# sourceMappingURL=decode.d.ts.map