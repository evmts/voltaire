import type { Uint256Type } from "./Uint256Type.js";
/**
 * Create Uint256 from number
 *
 * @param value - number to convert
 * @returns Uint256 value
 * @throws {UintNotIntegerError} If value is not an integer
 * @throws {UintNegativeError} If value is negative
 * @throws {UintOverflowError} If value exceeds maximum
 *
 * @example
 * ```typescript
 * const value = Uint.fromNumber(255);
 * ```
 */
export declare function fromNumber(value: number): Uint256Type;
//# sourceMappingURL=fromNumber.d.ts.map