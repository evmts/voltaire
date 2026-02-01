/**
 * Create Int128 from bigint, number, or string
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int128 documentation
 * @since 0.0.0
 * @param {bigint | number | string} value - bigint, number, or decimal/hex string
 * @returns {import('./Int128Type.js').BrandedInt128} Int128 value
 * @throws {InvalidFormatError} If value is not an integer
 * @throws {IntegerOverflowError} If value exceeds maximum
 * @throws {IntegerUnderflowError} If value is below minimum
 * @example
 * ```javascript
 * import * as Int128 from './primitives/Int128/index.js';
 * const a = Int128.from(-100n);
 * const b = Int128.from("-255");
 * const c = Int128.from("0xff");
 * const d = Int128.from(-42);
 * ```
 */
export function from(value: bigint | number | string): import("./Int128Type.js").BrandedInt128;
//# sourceMappingURL=from.d.ts.map