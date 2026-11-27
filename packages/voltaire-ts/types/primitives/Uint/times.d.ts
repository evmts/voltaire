import type { Uint256Type } from "./Uint256Type.js";
/**
 * Multiply two Uint256 values with overflow checking
 *
 * Overflow mode: checked (uniform across all Uint sizes).
 * Use `timesWrapping` for wrapping mod 2^256 arithmetic.
 *
 * @param uint - First operand
 * @param b - Second operand
 * @returns Product (uint * b)
 * @throws {UintOverflowError} If the result exceeds 2^256 - 1
 *
 * @example
 * ```typescript
 * const a = Uint(10n);
 * const b = Uint(5n);
 * const product1 = Uint.times(a, b); // 50n
 * const product2 = a.times(b); // 50n
 * ```
 */
export declare function times(uint: Uint256Type, b: Uint256Type): Uint256Type;
//# sourceMappingURL=times.d.ts.map