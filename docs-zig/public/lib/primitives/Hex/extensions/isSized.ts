import type { HexType } from "../HexType.js";

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
 * ```ts
 * import * as Hex from './primitives/Hex/index.js';
 * Hex.isSized('0x1234', 2); // true
 * Hex.isSized('0x1234', 4); // false
 * ```
 */
export function isSized(value: HexType, size: number): boolean {
	return (value.length - 2) / 2 === size;
}
