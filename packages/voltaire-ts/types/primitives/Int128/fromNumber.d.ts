/**
 * Create Int128 from number
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int128 documentation
 * @since 0.0.0
 * @param {number} value - Integer number
 * @returns {import('./Int128Type.js').BrandedInt128} Int128 value
 * @throws {InvalidFormatError} If value is not an integer
 * @throws {IntegerOverflowError} If value exceeds maximum
 * @throws {IntegerUnderflowError} If value is below minimum
 * @example
 * ```javascript
 * import * as Int128 from './primitives/Int128/index.js';
 * const a = Int128.fromNumber(-42);
 * const b = Int128.fromNumber(100);
 * ```
 */
export function fromNumber(value: number): import("./Int128Type.js").BrandedInt128;
//# sourceMappingURL=fromNumber.d.ts.map