import type { BrandedHex } from "./BrandedHex.js";

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
export function equals(hex: BrandedHex, other: BrandedHex): boolean {
	return hex.toLowerCase() === other.toLowerCase();
}
