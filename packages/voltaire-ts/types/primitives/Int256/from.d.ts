/**
 * Create Int256 from bigint, number, or string
 *
 * @see https://voltaire.tevm.sh/primitives/int256 for Int256 documentation
 * @since 0.0.0
 * @param {bigint | number | string} value - bigint, number, or decimal/hex string
 * @returns {import('./Int256Type.js').BrandedInt256} Int256 value
 * @throws {InvalidFormatError} If value is not an integer
 * @throws {IntegerOverflowError} If value exceeds maximum
 * @throws {IntegerUnderflowError} If value is below minimum
 * @example
 * ```javascript
 * import * as Int256 from './primitives/Int256/index.js';
 * const a = Int256.from(-100n);
 * const b = Int256.from("-255");
 * const c = Int256.from("0xff");
 * const d = Int256.from(-42);
 * ```
 */
export function from(value: bigint | number | string): import("./Int256Type.js").BrandedInt256;
//# sourceMappingURL=from.d.ts.map