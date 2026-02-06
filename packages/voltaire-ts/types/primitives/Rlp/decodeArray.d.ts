/**
 * Decodes RLP-encoded bytes to an array
 *
 * @see https://voltaire.tevm.sh/primitives/rlp for RLP documentation
 * @since 0.0.0
 * @param {Uint8Array} data - RLP-encoded data
 * @returns {any[]} Decoded array
 * @throws {Error} If decoding fails
 * @example
 * ```javascript
 * import * as Rlp from './primitives/Rlp/index.js';
 * const encoded = Rlp.encodeArray([
 *   new Uint8Array([1, 2]),
 *   new Uint8Array([3, 4])
 * ]);
 * const arr = Rlp.decodeArray(encoded);
 * // => [Uint8Array([1, 2]), Uint8Array([3, 4])]
 * ```
 */
export function decodeArray(data: Uint8Array): any[];
//# sourceMappingURL=decodeArray.d.ts.map