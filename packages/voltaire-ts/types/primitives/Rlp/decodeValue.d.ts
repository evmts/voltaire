/**
 * Decodes RLP-encoded bytes and returns the value directly
 *
 * This is a convenience wrapper around decode() that returns just the decoded value
 * without the metadata wrapper. For streaming/partial decoding with remainder access,
 * use decode() instead.
 *
 * @see https://voltaire.tevm.sh/primitives/rlp for RLP documentation
 * @since 0.1.42
 * @param {Uint8Array} bytes - RLP-encoded data
 * @returns {Uint8Array | any[]} Decoded value (Uint8Array for bytes, nested arrays for lists)
 * @throws {import('./RlpError.js').RlpDecodingError} If decoding fails
 * @example
 * ```javascript
 * import * as Rlp from './primitives/Rlp/index.js';
 *
 * // Decode bytes - returns Uint8Array directly
 * const bytes = new Uint8Array([0x83, 1, 2, 3]);
 * const value = Rlp.decodeValue(bytes);
 * // => Uint8Array([1, 2, 3])
 *
 * // Decode list - returns nested arrays
 * const list = new Uint8Array([0xc3, 0x01, 0x02, 0x03]);
 * const items = Rlp.decodeValue(list);
 * // => [Uint8Array([1]), Uint8Array([2]), Uint8Array([3])]
 *
 * // Compare with decode() which returns metadata:
 * // Rlp.decode(bytes) => { data: { type: 'bytes', value: Uint8Array([1,2,3]) }, remainder: Uint8Array([]) }
 * // Rlp.decodeValue(bytes) => Uint8Array([1, 2, 3])
 * ```
 */
export function decodeValue(bytes: Uint8Array): Uint8Array | any[];
//# sourceMappingURL=decodeValue.d.ts.map