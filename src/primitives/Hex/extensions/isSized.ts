import type { Hex } from "ox";
import * as OxHex from "ox/Hex";

/**
 * Check if hex value has a specific size
 * Voltaire extension - not available in Ox
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param value - Hex value to check
 * @param size - Expected size in bytes
 * @returns True if hex value has the specified size
 * @throws {never}
 * @example
 * ```typescript
 * import * as Hex from './primitives/Hex/index.js';
 * Hex.isSized('0x1234', 2); // true
 * Hex.isSized('0x1234', 4); // false
 * ```
 */
export function isSized(value: Hex.Hex, size: number): boolean {
	return OxHex.size(value) === size;
}
