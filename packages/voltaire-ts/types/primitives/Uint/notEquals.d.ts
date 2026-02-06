import type { Uint256Type } from "./Uint256Type.js";
/**
 * Check inequality
 *
 * @param uint - First value
 * @param b - Second value
 * @returns true if uint !== b
 *
 * @example
 * ```typescript
 * const a = Uint(100n);
 * const b = Uint(200n);
 * const isNotEq1 = Uint.notEquals(a, b); // true
 * const isNotEq2 = a.notEquals(b); // true
 * ```
 */
export declare function notEquals(uint: Uint256Type, b: Uint256Type): boolean;
//# sourceMappingURL=notEquals.d.ts.map