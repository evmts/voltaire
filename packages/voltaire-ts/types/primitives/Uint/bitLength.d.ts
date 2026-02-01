import type { Uint256Type } from "./Uint256Type.js";
/**
 * Get number of bits required to represent value
 *
 * @param uint - Value to check
 * @returns Number of bits (0-256)
 *
 * @example
 * ```typescript
 * const a = Uint(255n);
 * const bits1 = Uint.bitLength(a); // 8
 * const bits2 = a.bitLength(); // 8
 * ```
 */
export declare function bitLength(uint: Uint256Type): number;
//# sourceMappingURL=bitLength.d.ts.map