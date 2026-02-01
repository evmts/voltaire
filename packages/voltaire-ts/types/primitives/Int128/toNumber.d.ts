/**
 * Convert Int128 to number (warns on overflow)
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int128 documentation
 * @since 0.0.0
 * @param {import('./Int128Type.js').BrandedInt128} value - Int128 value
 * @returns {number} Number value
 * @throws {InvalidRangeError} If value exceeds Number.MAX_SAFE_INTEGER or Number.MIN_SAFE_INTEGER
 * @example
 * ```javascript
 * import * as Int128 from './primitives/Int128/index.js';
 * const a = Int128.from(-42n);
 * Int128.toNumber(a); // -42
 * ```
 */
export function toNumber(value: import("./Int128Type.js").BrandedInt128): number;
//# sourceMappingURL=toNumber.d.ts.map