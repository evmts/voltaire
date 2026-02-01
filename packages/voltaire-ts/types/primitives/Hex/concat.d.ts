import type { HexType } from "./HexType.js";
/**
 * Concatenate multiple hex strings
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param hexes - Hex strings to concatenate
 * @returns Concatenated hex string
 * @throws {InvalidFormatError} If missing 0x prefix or contains invalid hex characters
 * @throws {InvalidLengthError} If hex has odd number of digits
 * @example
 * ```typescript
 * import * as Hex from './primitives/Hex/index.js';
 * Hex.concat('0x12', '0x34', '0x56'); // '0x123456'
 * ```
 */
export declare function concat(...hexes: HexType[]): HexType;
//# sourceMappingURL=concat.d.ts.map