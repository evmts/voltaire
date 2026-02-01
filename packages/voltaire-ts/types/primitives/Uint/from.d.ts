import type { Uint256Type } from "./Uint256Type.js";
/**
 * Create Uint256 from bigint or string (standard form)
 *
 * @param value - bigint or decimal/hex string
 * @returns Uint256 value
 * @throws {UintNotIntegerError} If number value is not an integer
 * @throws {UintNegativeError} If value is negative
 * @throws {UintOverflowError} If value exceeds maximum
 *
 * @example
 * ```typescript
 * const a = Uint.from(100n);
 * const b = Uint.from("255");
 * const c = Uint.from("0xff");
 * ```
 */
export declare function from(value: bigint | number | string): Uint256Type;
//# sourceMappingURL=from.d.ts.map