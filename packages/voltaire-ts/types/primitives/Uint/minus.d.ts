import type { Uint256Type } from "./Uint256Type.js";
/**
 * Subtract two Uint256 values with underflow checking
 *
 * Overflow mode: checked (uniform across all Uint sizes).
 * Use `minusWrapping` for wrapping mod 2^256 arithmetic.
 *
 * @param uint - First operand
 * @param b - Second operand
 * @returns Difference (uint - b)
 * @throws {UintNegativeError} If the result is negative
 *
 * @example
 * ```typescript
 * const a = Uint(100n);
 * const b = Uint(50n);
 * const diff1 = Uint.minus(a, b); // 50n
 * const diff2 = a.minus(b); // 50n
 * ```
 */
export declare function minus(uint: Uint256Type, b: Uint256Type): Uint256Type;
//# sourceMappingURL=minus.d.ts.map