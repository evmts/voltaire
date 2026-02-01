import type { PublicKeyType } from "./PublicKeyType.js";
/**
 * Create PublicKey from hex string
 *
 * @param hex - Hex string (64 bytes uncompressed)
 * @returns Public key
 * @throws {InvalidFormatError} If hex string format is invalid
 * @throws {InvalidLengthError} If hex is not 64 bytes
 *
 * @example
 * ```typescript
 * const pk = PublicKey.from("0x1234...");
 * ```
 */
export declare function from(hex: string): PublicKeyType;
//# sourceMappingURL=from.d.ts.map