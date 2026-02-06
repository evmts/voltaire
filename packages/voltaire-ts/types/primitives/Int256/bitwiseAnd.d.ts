/**
 * Bitwise AND of Int256 values
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int256 documentation
 * @since 0.0.0
 * @param {import('./Int256Type.js').BrandedInt256} a - First value
 * @param {import('./Int256Type.js').BrandedInt256} b - Second value
 * @returns {import('./Int256Type.js').BrandedInt256} Result
 * @example
 * ```javascript
 * import * as Int256 from './primitives/Int256/index.js';
 * const a = Int256.from(0x0fn);
 * const b = Int256.from(0x07n);
 * Int256.bitwiseAnd(a, b); // 0x07n
 * ```
 */
export function bitwiseAnd(a: import("./Int256Type.js").BrandedInt256, b: import("./Int256Type.js").BrandedInt256): import("./Int256Type.js").BrandedInt256;
//# sourceMappingURL=bitwiseAnd.d.ts.map