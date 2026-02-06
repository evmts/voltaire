/**
 * Arithmetic right shift of Int128 (sign-preserving)
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int128 documentation
 * @since 0.0.0
 * @param {import('./Int128Type.js').BrandedInt128} value - Value to shift
 * @param {number | bigint} shift - Shift amount
 * @returns {import('./Int128Type.js').BrandedInt128} Shifted value (sign-extended)
 * @throws {InvalidRangeError} If shift amount is negative
 * @example
 * ```javascript
 * import * as Int128 from './primitives/Int128/index.js';
 * const a = Int128.from(-256n);
 * Int128.shiftRight(a, 1); // -128n (sign preserved)
 * ```
 */
export function shiftRight(value: import("./Int128Type.js").BrandedInt128, shift: number | bigint): import("./Int128Type.js").BrandedInt128;
//# sourceMappingURL=shiftRight.d.ts.map