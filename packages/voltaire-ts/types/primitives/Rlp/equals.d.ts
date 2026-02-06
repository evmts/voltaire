/**
 * Check if two RLP Data structures are equal
 *
 * @see https://voltaire.tevm.sh/primitives/rlp for RLP documentation
 * @since 0.0.0
 * @param {import('./RlpType.js').BrandedRlp} data - First RLP data structure
 * @param {import('./RlpType.js').BrandedRlp} other - Second RLP data structure
 * @returns {boolean} True if structures are deeply equal
 * @throws {never}
 * @example
 * ```javascript
 * import * as Rlp from './primitives/Rlp/index.js';
 * const a = { type: 'bytes', value: new Uint8Array([1, 2]) };
 * const b = { type: 'bytes', value: new Uint8Array([1, 2]) };
 * Rlp.equals(a, b); // => true
 * ```
 */
export function equals(data: import("./RlpType.js").BrandedRlp, other: import("./RlpType.js").BrandedRlp): boolean;
//# sourceMappingURL=equals.d.ts.map