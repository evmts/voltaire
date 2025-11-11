import type { BrandedHex, Sized } from "./BrandedHex.js";

/**
 * Check if hex has specific byte size
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param hex - Hex string to check
 * @param targetSize - Expected size in bytes
 * @returns True if size matches
 * @throws {never}
 * @example
 * ```typescript
 * import * as Hex from './primitives/Hex/index.js';
 * const hex = Hex.from('0x1234');
 * Hex.isSized(hex, 2); // true
 * ```
 */
export function isSized<TSize extends number>(
	hex: BrandedHex,
	targetSize: TSize,
): hex is Sized<TSize> {
	return (hex.length - 2) / 2 === targetSize;
}
