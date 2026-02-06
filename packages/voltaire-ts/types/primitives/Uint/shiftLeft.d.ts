import type { Uint256Type } from "./Uint256Type.js";
/**
 * Left shift
 *
 * @param uint - Value to shift
 * @param bits - Number of bits to shift
 * @returns uint << bits (mod 2^256)
 *
 * @example
 * ```typescript
 * const a = Uint(1n);
 * const b = Uint(8n);
 * const result1 = Uint.shiftLeft(a, b); // 256
 * const result2 = a.shiftLeft(b); // 256
 * ```
 */
export declare function shiftLeft(uint: Uint256Type, bits: Uint256Type): Uint256Type;
//# sourceMappingURL=shiftLeft.d.ts.map