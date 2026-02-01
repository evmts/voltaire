import { MAX } from "./constants.js";
/**
 * Bitwise NOT
 *
 * @param uint - Operand
 * @returns ~uint & MAX
 *
 * @example
 * ```typescript
 * const a = Uint(0n);
 * const result1 = Uint.bitwiseNot(a); // MAX
 * const result2 = a.bitwiseNot(); // MAX
 * ```
 */
export function bitwiseNot(uint) {
    return (~uint & MAX);
}
