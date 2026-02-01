import type { Uint256Type } from "./Uint256Type.js";
/**
 * Convert Uint256 to hex string
 *
 * @param uint - Uint256 value to convert
 * @param padded - Whether to pad to 64 characters (32 bytes)
 * @returns Hex string with 0x prefix
 *
 * @example
 * ```typescript
 * const value = Uint(255n);
 * const hex1 = Uint.toHex(value); // "0x00...ff"
 * const hex2 = value.toHex(); // "0x00...ff"
 * const hex3 = value.toHex(false); // "0xff"
 * ```
 */
export declare function toHex(uint: Uint256Type, padded?: boolean): string;
//# sourceMappingURL=toHex.d.ts.map