/**
 * Get bit length of Int256 value
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int256 documentation
 * @since 0.0.0
 * @param {import('./Int256Type.js').BrandedInt256} value - Input value
 * @returns {number} Number of bits needed to represent value
 * @example
 * ```javascript
 * import * as Int256 from './primitives/Int256/index.js';
 * const a = Int256.from(255n);
 * Int256.bitLength(a); // 8
 * ```
 */
export function bitLength(value: import("./Int256Type.js").BrandedInt256): number;
//# sourceMappingURL=bitLength.d.ts.map