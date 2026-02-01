/**
 * Decodes RLP-encoded bytes to an object with known keys
 *
 * @see https://voltaire.tevm.sh/primitives/rlp for RLP documentation
 * @since 0.0.0
 * @param {Uint8Array} data - RLP-encoded data
 * @returns {Record<string, any>} Decoded object
 * @throws {RlpDecodingError} If decoding fails or data format is invalid
 * @example
 * ```javascript
 * import * as Rlp from './primitives/Rlp/index.js';
 * const obj = { name: new Uint8Array([65, 66]), age: new Uint8Array([25]) };
 * const encoded = Rlp.encodeObject(obj);
 * const decoded = Rlp.decodeObject(encoded);
 * ```
 */
export function decodeObject(data: Uint8Array): Record<string, any>;
//# sourceMappingURL=decodeObject.d.ts.map