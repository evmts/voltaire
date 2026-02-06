import type { HexType } from "./HexType.js";
/**
 * Check if two hex strings are equal
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param hex - First hex string
 * @param other - Hex string to compare with
 * @returns True if equal
 * @throws {never}
 * @example
 * ```typescript
 * import * as Hex from './primitives/Hex/index.js';
 * const hex = Hex.from('0x1234');
 * Hex.equals(hex, Hex.from('0x1234')); // true
 * ```
 */
export declare function equals(hex: HexType, other: HexType): boolean;
//# sourceMappingURL=equals.d.ts.map