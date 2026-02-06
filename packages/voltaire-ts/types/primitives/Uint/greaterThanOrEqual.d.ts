import type { Uint256Type } from "./Uint256Type.js";
/**
 * Check greater than or equal
 *
 * @param uint - First value
 * @param b - Second value
 * @returns true if uint >= b
 *
 * @example
 * ```typescript
 * const a = Uint(100n);
 * const b = Uint(100n);
 * const isGte1 = Uint.greaterThanOrEqual(a, b); // true
 * const isGte2 = a.greaterThanOrEqual(b); // true
 * ```
 */
export declare function greaterThanOrEqual(uint: Uint256Type, b: Uint256Type): boolean;
//# sourceMappingURL=greaterThanOrEqual.d.ts.map