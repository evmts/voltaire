import type { Uint256Type } from "./Uint256Type.js";
/**
 * Create Uint256 from bytes (big-endian)
 *
 * @param bytes - bytes to convert
 * @returns Uint256 value
 * @throws {UintInvalidLengthError} If bytes length exceeds 32
 *
 * @example
 * ```typescript
 * const bytes = new Uint8Array([0xff, 0x00]);
 * const value = Uint.fromBytes(bytes);
 * ```
 */
export declare function fromBytes(bytes: Uint8Array): Uint256Type;
//# sourceMappingURL=fromBytes.d.ts.map