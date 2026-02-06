/**
 * Get bit length of Int128 value
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int128 documentation
 * @since 0.0.0
 * @param {import('./Int128Type.js').BrandedInt128} value - Input value
 * @returns {number} Number of bits needed to represent value
 * @example
 * ```javascript
 * import * as Int128 from './primitives/Int128/index.js';
 * const a = Int128.from(255n);
 * Int128.bitLength(a); // 8
 * ```
 */
export function bitLength(value: import("./Int128Type.js").BrandedInt128): number;
//# sourceMappingURL=bitLength.d.ts.map