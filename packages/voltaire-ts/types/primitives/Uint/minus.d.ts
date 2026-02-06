import type { Uint256Type } from "./Uint256Type.js";
/**
 * Subtract Uint256 value with wrapping
 *
 * @param uint - First operand
 * @param b - Second operand
 * @returns Difference (uint - b) mod 2^256
 *
 * @example
 * ```typescript
 * const a = Uint(100n);
 * const b = Uint(50n);
 * const diff1 = Uint.minus(a, b); // 50
 * const diff2 = a.minus(b); // 50
 * ```
 */
export declare function minus(uint: Uint256Type, b: Uint256Type): Uint256Type;
//# sourceMappingURL=minus.d.ts.map