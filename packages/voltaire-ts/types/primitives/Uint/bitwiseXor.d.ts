import type { Uint256Type } from "./Uint256Type.js";
/**
 * Bitwise XOR
 *
 * @param uint - First operand
 * @param b - Second operand
 * @returns uint ^ b
 *
 * @example
 * ```typescript
 * const a = Uint(0xffn);
 * const b = Uint(0x0fn);
 * const result1 = Uint.bitwiseXor(a, b); // 0xf0
 * const result2 = a.bitwiseXor(b); // 0xf0
 * ```
 */
export declare function bitwiseXor(uint: Uint256Type, b: Uint256Type): Uint256Type;
//# sourceMappingURL=bitwiseXor.d.ts.map