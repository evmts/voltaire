import type { HexType } from "./HexType.js";
/**
 * Slice hex string
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param hex - Hex string to slice
 * @param start - Start byte index
 * @param end - End byte index (optional)
 * @returns Sliced hex string
 * @throws {InvalidFormatError} If missing 0x prefix or contains invalid hex characters
 * @throws {InvalidLengthError} If hex has odd number of digits
 * @example
 * ```typescript
 * import * as Hex from './primitives/Hex/index.js';
 * const hex = Hex.from('0x123456');
 * const sliced = Hex.slice(hex, 1); // '0x3456'
 * ```
 */
export declare function slice(hex: HexType, start: number, end?: number): HexType;
//# sourceMappingURL=slice.d.ts.map