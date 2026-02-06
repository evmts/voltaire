/**
 * Multiply Int128 values with wrapping
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int128 documentation
 * @since 0.0.0
 * @param {import('./Int128Type.js').BrandedInt128} a - First operand
 * @param {import('./Int128Type.js').BrandedInt128} b - Second operand
 * @returns {import('./Int128Type.js').BrandedInt128} Product with wrapping
 * @example
 * ```javascript
 * import * as Int128 from './primitives/Int128/index.js';
 * const a = Int128.from(10n);
 * const b = Int128.from(-5n);
 * const product = Int128.times(a, b); // -50n
 * ```
 */
export function times(a: import("./Int128Type.js").BrandedInt128, b: import("./Int128Type.js").BrandedInt128): import("./Int128Type.js").BrandedInt128;
//# sourceMappingURL=times.d.ts.map