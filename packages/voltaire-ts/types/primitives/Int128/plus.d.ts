/**
 * Add Int128 values with wrapping
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int128 documentation
 * @since 0.0.0
 * @param {import('./Int128Type.js').BrandedInt128} a - First operand
 * @param {import('./Int128Type.js').BrandedInt128} b - Second operand
 * @returns {import('./Int128Type.js').BrandedInt128} Sum with wrapping
 * @example
 * ```javascript
 * import * as Int128 from './primitives/Int128/index.js';
 * const a = Int128.from(-100n);
 * const b = Int128.from(50n);
 * const sum = Int128.plus(a, b); // -50n
 * ```
 */
export function plus(a: import("./Int128Type.js").BrandedInt128, b: import("./Int128Type.js").BrandedInt128): import("./Int128Type.js").BrandedInt128;
//# sourceMappingURL=plus.d.ts.map