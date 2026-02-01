import type { HexType } from "./HexType.js";
/**
 * XOR with another hex string of same length
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param hex - First hex string
 * @param other - Hex string to XOR with
 * @returns XOR result
 * @throws {InvalidFormatError} If missing 0x prefix or contains invalid hex characters
 * @throws {InvalidLengthError} If hex has odd number of digits or lengths don't match
 * @example
 * ```typescript
 * import * as Hex from './primitives/Hex/index.js';
 * const hex = Hex.from('0x12');
 * const result = Hex.xor(hex, Hex.from('0x34')); // '0x26'
 * ```
 */
export declare function xor(hex: HexType, other: HexType): HexType;
//# sourceMappingURL=xor.d.ts.map