import type { HexType } from "./HexType.js";
/**
 * Convert hex to bytes
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param hex - Hex string to convert
 * @returns Byte array
 * @throws {InvalidFormatError} If missing 0x prefix or contains invalid hex characters
 * @throws {InvalidLengthError} If hex has odd number of digits
 * @example
 * ```typescript
 * import * as Hex from './primitives/Hex/index.js';
 * const hex = Hex.from('0x1234');
 * const bytes = Hex.toBytes(hex); // Uint8Array([0x12, 0x34])
 * ```
 */
export declare function toBytes(hex: HexType | `0x${string}` | string): Uint8Array;
//# sourceMappingURL=toBytes.d.ts.map