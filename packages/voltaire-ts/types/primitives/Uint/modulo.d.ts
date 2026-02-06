import type { Uint256Type } from "./Uint256Type.js";
/**
 * Modulo operation
 *
 * @param uint - Dividend
 * @param b - Divisor
 * @returns Remainder (uint % b)
 * @throws {UintDivisionByZeroError} If divisor is zero
 *
 * @example
 * ```typescript
 * const a = Uint(100n);
 * const b = Uint(30n);
 * const remainder1 = Uint.modulo(a, b); // 10
 * const remainder2 = a.modulo(b); // 10
 * ```
 */
export declare function modulo(uint: Uint256Type, b: Uint256Type): Uint256Type;
//# sourceMappingURL=modulo.d.ts.map