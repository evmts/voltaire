import type { Uint256Type } from "./Uint256Type.js";
/**
 * Convert Uint256 to number
 *
 * @param uint - Uint256 value to convert
 * @returns number value
 * @throws {UintSafeIntegerOverflowError} If value exceeds MAX_SAFE_INTEGER
 *
 * @example
 * ```typescript
 * const value = Uint(255n);
 * const num1 = Uint.toNumber(value);
 * const num2 = value.toNumber();
 * ```
 */
export declare function toNumber(uint: Uint256Type): number;
//# sourceMappingURL=toNumber.d.ts.map