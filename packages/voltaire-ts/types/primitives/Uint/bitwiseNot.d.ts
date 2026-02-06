import type { Uint256Type } from "./Uint256Type.js";
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
export declare function bitwiseNot(uint: Uint256Type): Uint256Type;
//# sourceMappingURL=bitwiseNot.d.ts.map