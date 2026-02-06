import type { Uint256Type } from "./Uint256Type.js";
/**
 * Create Uint256 from hex string
 *
 * @param hex - Hex string to convert
 * @returns Uint256 value
 * @throws {UintNegativeError} If value is negative
 * @throws {UintOverflowError} If value exceeds maximum
 *
 * @example
 * ```typescript
 * const value = Uint.fromHex("0xff");
 * const value2 = Uint.fromHex("ff");
 * ```
 */
export declare function fromHex(hex: string): Uint256Type;
//# sourceMappingURL=fromHex.d.ts.map