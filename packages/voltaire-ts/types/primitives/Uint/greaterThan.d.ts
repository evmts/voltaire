import type { Uint256Type } from "./Uint256Type.js";
/**
 * Check greater than
 *
 * @param uint - First value
 * @param b - Second value
 * @returns true if uint > b
 *
 * @example
 * ```typescript
 * const a = Uint(200n);
 * const b = Uint(100n);
 * const isGreater1 = Uint.greaterThan(a, b); // true
 * const isGreater2 = a.greaterThan(b); // true
 * ```
 */
export declare function greaterThan(uint: Uint256Type, b: Uint256Type): boolean;
//# sourceMappingURL=greaterThan.d.ts.map