/**
 * Gets the total length of an RLP item (prefix + payload)
 *
 * @see https://voltaire.tevm.sh/primitives/rlp for RLP documentation
 * @since 0.0.0
 * @param {Uint8Array} data - RLP-encoded data
 * @returns {number} Total length in bytes
 * @throws {RlpDecodingError} If data is empty, too short, or has invalid prefix
 * @example
 * ```javascript
 * import * as Rlp from './primitives/Rlp/index.js';
 * const encoded = new Uint8Array([0x83, 1, 2, 3]);
 * const length = Rlp.getLength(encoded);
 * // => 4 (1 byte prefix + 3 bytes payload)
 * ```
 */
export function getLength(data: Uint8Array): number;
//# sourceMappingURL=getLength.d.ts.map