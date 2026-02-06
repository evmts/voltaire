/**
 * Count set bits in Int256 two's complement representation
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int256 documentation
 * @since 0.0.0
 * @param {import('./Int256Type.js').BrandedInt256} value - Input value
 * @returns {number} Number of set bits
 * @example
 * ```javascript
 * import * as Int256 from './primitives/Int256/index.js';
 * const a = Int256.from(0x0fn);
 * Int256.popCount(a); // 4
 * ```
 */
export function popCount(value: import("./Int256Type.js").BrandedInt256): number;
//# sourceMappingURL=popCount.d.ts.map