import type { HexType } from "./HexType.js";
/**
 * Convert hex to string
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param hex - Hex string to convert
 * @returns Decoded string
 * @throws {InvalidFormatError} If missing 0x prefix or contains invalid hex characters
 * @throws {InvalidLengthError} If hex has odd number of digits
 * @example
 * ```typescript
 * import * as Hex from './primitives/Hex/index.js';
 * const hex = Hex.from('0x68656c6c6f');
 * const str = Hex.toString(hex); // 'hello'
 * ```
 */
export declare function toString(hex: HexType): string;
//# sourceMappingURL=toString.d.ts.map