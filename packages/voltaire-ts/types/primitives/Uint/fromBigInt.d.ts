import type { Uint256Type } from "./Uint256Type.js";
/**
 * Create Uint256 from bigint
 *
 * @param value - bigint to convert
 * @returns Uint256 value
 * @throws {UintNegativeError} If value is negative
 * @throws {UintOverflowError} If value exceeds maximum
 *
 * @example
 * ```typescript
 * const value = Uint.fromBigInt(100n);
 * ```
 */
export declare function fromBigInt(value: bigint): Uint256Type;
//# sourceMappingURL=fromBigInt.d.ts.map