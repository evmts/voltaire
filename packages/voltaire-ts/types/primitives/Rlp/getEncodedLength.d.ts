/**
 * Get the total byte length of RLP-encoded data without actually encoding
 *
 * @see https://voltaire.tevm.sh/primitives/rlp for RLP documentation
 * @since 0.0.0
 * @param {Uint8Array | import('./RlpType.js').BrandedRlp | any[]} data - Data to measure
 * @returns {number} Length in bytes after RLP encoding
 * @throws {RlpEncodingError} If data type is invalid
 * @example
 * ```javascript
 * import * as Rlp from './primitives/Rlp/index.js';
 * const bytes = new Uint8Array([1, 2, 3]);
 * const length = Rlp.getEncodedLength(bytes);
 * // => 4 (0x83 prefix + 3 bytes)
 * ```
 */
export function getEncodedLength(data: Uint8Array | import("./RlpType.js").BrandedRlp | any[]): number;
//# sourceMappingURL=getEncodedLength.d.ts.map