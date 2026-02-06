import type { HexType } from "./HexType.js";
/**
 * Trim leading zeros from hex
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param hex - Hex string to trim
 * @returns Trimmed hex string
 * @throws {InvalidFormatError} If missing 0x prefix or contains invalid hex characters
 * @throws {InvalidLengthError} If hex has odd number of digits
 * @example
 * ```typescript
 * import * as Hex from './primitives/Hex/index.js';
 * const hex = Hex.from('0x00001234');
 * const trimmed = Hex.trim(hex); // '0x1234'
 * ```
 */
export declare function trim(hex: HexType): HexType;
//# sourceMappingURL=trim.d.ts.map