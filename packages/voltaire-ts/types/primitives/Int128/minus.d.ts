/**
 * Subtract Int128 values with wrapping
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int128 documentation
 * @since 0.0.0
 * @param {import('./Int128Type.js').BrandedInt128} a - Minuend
 * @param {import('./Int128Type.js').BrandedInt128} b - Subtrahend
 * @returns {import('./Int128Type.js').BrandedInt128} Difference with wrapping
 * @example
 * ```javascript
 * import * as Int128 from './primitives/Int128/index.js';
 * const a = Int128.from(100n);
 * const b = Int128.from(50n);
 * const diff = Int128.minus(a, b); // 50n
 * ```
 */
export function minus(a: import("./Int128Type.js").BrandedInt128, b: import("./Int128Type.js").BrandedInt128): import("./Int128Type.js").BrandedInt128;
//# sourceMappingURL=minus.d.ts.map