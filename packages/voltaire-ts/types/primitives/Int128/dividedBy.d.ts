/**
 * Divide Int128 values (truncate toward zero)
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int128 documentation
 * @since 0.0.0
 * @param {import('./Int128Type.js').BrandedInt128} a - Dividend
 * @param {import('./Int128Type.js').BrandedInt128} b - Divisor
 * @returns {import('./Int128Type.js').BrandedInt128} Quotient (truncated toward zero)
 * @throws {InvalidRangeError} If divisor is zero
 * @throws {IntegerOverflowError} If MIN / -1 (overflow)
 * @example
 * ```javascript
 * import * as Int128 from './primitives/Int128/index.js';
 * const a = Int128.from(-10n);
 * const b = Int128.from(3n);
 * const quotient = Int128.dividedBy(a, b); // -3n (not -4n)
 * ```
 */
export function dividedBy(a: import("./Int128Type.js").BrandedInt128, b: import("./Int128Type.js").BrandedInt128): import("./Int128Type.js").BrandedInt128;
//# sourceMappingURL=dividedBy.d.ts.map