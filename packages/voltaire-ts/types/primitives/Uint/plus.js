import { MAX } from "./constants.js";
/**
 * Add Uint256 value with wrapping
 *
 * @param uint - First operand
 * @param b - Second operand
 * @returns Sum (uint + b) mod 2^256
 *
 * @example
 * ```typescript
 * const a = Uint(100n);
 * const b = Uint(50n);
 * const sum1 = Uint.plus(a, b); // 150
 * const sum2 = a.plus(b); // 150
 * ```
 */
export function plus(uint, b) {
    const sum = uint + b;
    return (sum & MAX);
}
