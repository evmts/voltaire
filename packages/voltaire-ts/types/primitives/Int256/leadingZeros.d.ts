/**
 * Count leading zeros in Int256 two's complement representation
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int256 documentation
 * @since 0.0.0
 * @param {import('./Int256Type.js').BrandedInt256} value - Input value
 * @returns {number} Number of leading zero bits
 * @example
 * ```javascript
 * import * as Int256 from './primitives/Int256/index.js';
 * const a = Int256.from(1n);
 * Int256.leadingZeros(a); // 127
 * ```
 */
export function leadingZeros(value: import("./Int256Type.js").BrandedInt256): number;
//# sourceMappingURL=leadingZeros.d.ts.map