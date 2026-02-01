import type { Uint256Type } from "./Uint256Type.js";
/**
 * Exponentiation
 *
 * @param uint - Base value
 * @param exponent - Exponent value
 * @returns uint^exponent mod 2^256
 *
 * @example
 * ```typescript
 * const base = Uint(2n);
 * const exp = Uint(8n);
 * const result1 = Uint.toPower(base, exp); // 256
 * const result2 = base.toPower(exp); // 256
 * ```
 */
export declare function toPower(uint: Uint256Type, exponent: Uint256Type): Uint256Type;
//# sourceMappingURL=toPower.d.ts.map