/**
 * Create Int256 from number
 *
 * @see https://voltaire.tevm.sh/primitives/int256 for Int256 documentation
 * @since 0.0.0
 * @param {number} value - Integer number
 * @returns {import('./Int256Type.js').BrandedInt256} Int256 value
 * @throws {InvalidFormatError} If value is not an integer
 * @throws {IntegerOverflowError} If value exceeds maximum
 * @throws {IntegerUnderflowError} If value is below minimum
 * @example
 * ```javascript
 * import * as Int256 from './primitives/Int256/index.js';
 * const a = Int256.fromNumber(-42);
 * const b = Int256.fromNumber(100);
 * ```
 */
export function fromNumber(value: number): import("./Int256Type.js").BrandedInt256;
//# sourceMappingURL=fromNumber.d.ts.map