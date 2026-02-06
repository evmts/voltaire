import type { Uint256Type } from "./Uint256Type.js";
/**
 * Get number of leading zero bits
 *
 * @param uint - Value to check
 * @returns Number of leading zeros (0-256)
 *
 * @example
 * ```typescript
 * const a = Uint(1n);
 * const zeros1 = Uint.leadingZeros(a); // 255
 * const zeros2 = a.leadingZeros(); // 255
 * ```
 */
export declare function leadingZeros(uint: Uint256Type): number;
//# sourceMappingURL=leadingZeros.d.ts.map