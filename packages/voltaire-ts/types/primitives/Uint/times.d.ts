import type { Uint256Type } from "./Uint256Type.js";
/**
 * Multiply Uint256 value with wrapping
 *
 * @param uint - First operand
 * @param b - Second operand
 * @returns Product (uint * b) mod 2^256
 *
 * @example
 * ```typescript
 * const a = Uint(10n);
 * const b = Uint(5n);
 * const product1 = Uint.times(a, b); // 50
 * const product2 = a.times(b); // 50
 * ```
 */
export declare function times(uint: Uint256Type, b: Uint256Type): Uint256Type;
//# sourceMappingURL=times.d.ts.map