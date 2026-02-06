/**
 * Shift Int128 left with wrapping
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int128 documentation
 * @since 0.0.0
 * @param {import('./Int128Type.js').BrandedInt128} value - Value to shift
 * @param {number | bigint} shift - Shift amount
 * @returns {import('./Int128Type.js').BrandedInt128} Shifted value
 * @throws {InvalidRangeError} If shift amount is negative
 * @example
 * ```javascript
 * import * as Int128 from './primitives/Int128/index.js';
 * const a = Int128.from(1n);
 * Int128.shiftLeft(a, 8); // 256n
 * ```
 */
export function shiftLeft(value: import("./Int128Type.js").BrandedInt128, shift: number | bigint): import("./Int128Type.js").BrandedInt128;
//# sourceMappingURL=shiftLeft.d.ts.map