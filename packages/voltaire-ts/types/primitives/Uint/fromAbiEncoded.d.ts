import type { Uint256Type } from "./Uint256Type.js";
/**
 * Decode Uint256 from ABI-encoded bytes (32 bytes, big-endian)
 *
 * @param bytes - 32-byte ABI-encoded data
 * @returns Decoded Uint256 value
 * @throws {UintInvalidLengthError} If bytes length is not 32
 *
 * @example
 * ```typescript
 * const encoded = new Uint8Array(32);
 * encoded[31] = 255;
 * const value = Uint.fromAbiEncoded(encoded); // 255n
 * ```
 */
export declare function fromAbiEncoded(bytes: Uint8Array): Uint256Type;
//# sourceMappingURL=fromAbiEncoded.d.ts.map