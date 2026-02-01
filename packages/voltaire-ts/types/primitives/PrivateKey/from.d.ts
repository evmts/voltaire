import type { PrivateKeyType } from "./PrivateKeyType.js";
/**
 * Create PrivateKey from hex string
 *
 * @param hex - Hex string (32 bytes)
 * @returns Private key
 * @throws {InvalidFormatError} If hex string format is invalid
 * @throws {InvalidLengthError} If hex is not 32 bytes
 * @throws {InvalidRangeError} If private key is out of range [1, n-1]
 *
 * @example
 * ```typescript
 * const pk = PrivateKey.from("0x1234...");
 * ```
 */
export declare function from(hex: string): PrivateKeyType;
//# sourceMappingURL=from.d.ts.map