/**
 * Count leading zeros in Int128 two's complement representation
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int128 documentation
 * @since 0.0.0
 * @param {import('./Int128Type.js').BrandedInt128} value - Input value
 * @returns {number} Number of leading zero bits
 * @example
 * ```javascript
 * import * as Int128 from './primitives/Int128/index.js';
 * const a = Int128.from(1n);
 * Int128.leadingZeros(a); // 127
 * ```
 */
export function leadingZeros(value: import("./Int128Type.js").BrandedInt128): number;
//# sourceMappingURL=leadingZeros.d.ts.map