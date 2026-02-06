import type { Uint256Type } from "./Uint256Type.js";
/**
 * Check if value is a valid Uint256
 *
 * @param value - Value to check
 * @returns true if value is valid Uint256
 *
 * @example
 * ```typescript
 * const isValid = Uint.isValid(100n); // true
 * const isInvalid = Uint.isValid(-1n); // false
 * ```
 */
export declare function isValid(value: unknown): value is Uint256Type;
//# sourceMappingURL=isValid.d.ts.map