/**
 * Return minimum of two Int128 values
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int128 documentation
 * @since 0.0.0
 * @param {import('./Int128Type.js').BrandedInt128} a - First value
 * @param {import('./Int128Type.js').BrandedInt128} b - Second value
 * @returns {import('./Int128Type.js').BrandedInt128} Minimum value
 * @example
 * ```javascript
 * import * as Int128 from './primitives/Int128/index.js';
 * const a = Int128.from(-42n);
 * const b = Int128.from(10n);
 * Int128.minimum(a, b); // -42n
 * ```
 */
export function minimum(a: import("./Int128Type.js").BrandedInt128, b: import("./Int128Type.js").BrandedInt128): import("./Int128Type.js").BrandedInt128;
//# sourceMappingURL=minimum.d.ts.map