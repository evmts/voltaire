/**
 * Convert JSON representation back to RLP Data
 *
 * @see https://voltaire.tevm.sh/primitives/rlp for RLP documentation
 * @since 0.0.0
 * @param {unknown} json - JSON object from toJSON
 * @returns {import('./RlpType.js').BrandedRlp} RLP data structure
 * @throws {RlpDecodingError} If JSON format is invalid or type is unrecognized
 * @example
 * ```javascript
 * import * as Rlp from './primitives/Rlp/index.js';
 * const json = { type: 'bytes', value: [1, 2, 3] };
 * const data = Rlp.fromJSON(json);
 * // => { type: 'bytes', value: Uint8Array([1, 2, 3]) }
 * ```
 */
export function fromJSON(json: unknown): import("./RlpType.js").BrandedRlp;
//# sourceMappingURL=fromJSON.d.ts.map