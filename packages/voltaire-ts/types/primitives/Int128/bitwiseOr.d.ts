/**
 * Bitwise OR of Int128 values
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int128 documentation
 * @since 0.0.0
 * @param {import('./Int128Type.js').BrandedInt128} a - First value
 * @param {import('./Int128Type.js').BrandedInt128} b - Second value
 * @returns {import('./Int128Type.js').BrandedInt128} Result
 * @example
 * ```javascript
 * import * as Int128 from './primitives/Int128/index.js';
 * const a = Int128.from(0x0fn);
 * const b = Int128.from(0x70n);
 * Int128.bitwiseOr(a, b); // 0x7fn
 * ```
 */
export function bitwiseOr(a: import("./Int128Type.js").BrandedInt128, b: import("./Int128Type.js").BrandedInt128): import("./Int128Type.js").BrandedInt128;
//# sourceMappingURL=bitwiseOr.d.ts.map