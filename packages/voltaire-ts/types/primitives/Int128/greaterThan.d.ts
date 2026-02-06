/**
 * Check if Int128 is greater than another
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int128 documentation
 * @since 0.0.0
 * @param {import('./Int128Type.js').BrandedInt128} a - First value
 * @param {import('./Int128Type.js').BrandedInt128} b - Second value
 * @returns {boolean} True if a > b
 * @example
 * ```javascript
 * import * as Int128 from './primitives/Int128/index.js';
 * const a = Int128.from(0n);
 * const b = Int128.from(-1n);
 * Int128.greaterThan(a, b); // true
 * ```
 */
export function greaterThan(a: import("./Int128Type.js").BrandedInt128, b: import("./Int128Type.js").BrandedInt128): boolean;
//# sourceMappingURL=greaterThan.d.ts.map