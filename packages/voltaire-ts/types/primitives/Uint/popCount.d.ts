import type { Uint256Type } from "./Uint256Type.js";
/**
 * Count number of set bits (population count)
 *
 * @param uint - Value to check
 * @returns Number of 1 bits
 *
 * @example
 * ```typescript
 * const a = Uint(0xffn);
 * const count1 = Uint.popCount(a); // 8
 * const count2 = a.popCount(); // 8
 * ```
 */
export declare function popCount(uint: Uint256Type): number;
//# sourceMappingURL=popCount.d.ts.map