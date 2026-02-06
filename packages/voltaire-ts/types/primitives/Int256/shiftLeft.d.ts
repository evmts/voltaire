/**
 * Shift Int256 left with wrapping
 *
 * @see https://voltaire.tevm.sh/primitives/int256 for Int256 documentation
 * @since 0.0.0
 * @param {import('./Int256Type.js').BrandedInt256} value - Value to shift
 * @param {number | bigint} shift - Shift amount
 * @returns {import('./Int256Type.js').BrandedInt256} Shifted value
 * @throws {InvalidRangeError} If shift amount is negative
 * @example
 * ```javascript
 * import * as Int256 from './primitives/Int256/index.js';
 * const a = Int256.from(1n);
 * Int256.shiftLeft(a, 8); // 256n
 * ```
 */
export function shiftLeft(value: import("./Int256Type.js").BrandedInt256, shift: number | bigint): import("./Int256Type.js").BrandedInt256;
//# sourceMappingURL=shiftLeft.d.ts.map