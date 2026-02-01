import type { Uint256Type } from "./Uint256Type.js";
/**
 * Convert Uint256 to bytes (big-endian, 32 bytes)
 *
 * @param uint - Uint256 value to convert
 * @returns 32-byte Uint8Array
 *
 * @example
 * ```typescript
 * const value = Uint(255n);
 * const bytes1 = Uint.toBytes(value);
 * const bytes2 = value.toBytes();
 * ```
 */
export declare function toBytes(uint: Uint256Type): Uint8Array;
//# sourceMappingURL=toBytes.d.ts.map