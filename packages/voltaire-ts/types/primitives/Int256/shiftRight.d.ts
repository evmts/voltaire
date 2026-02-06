/**
 * Arithmetic right shift of Int256 (EVM SAR - sign-preserving)
 *
 * EVM SAR semantics:
 * - Preserves sign bit during shift
 * - Negative values remain negative
 * - -256 >> 1 = -128 (not 128)
 * - Equivalent to division by 2^shift with floor toward negative infinity
 *
 * @see https://voltaire.tevm.sh/primitives/int256 for Int256 documentation
 * @see https://eips.ethereum.org/EIPS/eip-145 for EVM SAR specification
 * @since 0.0.0
 * @param {import('./Int256Type.js').BrandedInt256} value - Value to shift
 * @param {number | bigint} shift - Shift amount
 * @returns {import('./Int256Type.js').BrandedInt256} Shifted value (sign-extended)
 * @throws {InvalidRangeError} If shift amount is negative
 * @example
 * ```javascript
 * import * as Int256 from './primitives/Int256/index.js';
 * // EVM SAR examples
 * const a = Int256.from(-256n);
 * Int256.shiftRight(a, 1); // -128n (sign preserved)
 *
 * const b = Int256.from(-1n);
 * Int256.shiftRight(b, 8); // -1n (all bits remain 1)
 * ```
 */
export function shiftRight(value: import("./Int256Type.js").BrandedInt256, shift: number | bigint): import("./Int256Type.js").BrandedInt256;
//# sourceMappingURL=shiftRight.d.ts.map