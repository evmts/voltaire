import * as OxHex from "ox/Hex";
import type { Hex } from "ox";

/**
 * Assert that hex value has a specific size, throws if not
 * Voltaire extension - not available in Ox
 *
 * @param value - Hex value to check
 * @param size - Expected size in bytes
 * @throws {Error} If hex value doesn't have the specified size
 *
 * @example
 * assertSize('0x1234', 2) // No error
 * assertSize('0x1234', 4) // Throws error
 */
export function assertSize(value: Hex.Hex, size: number): void {
	const actualSize = OxHex.size(value);
	if (actualSize !== size) {
		throw new Error(
			`Invalid hex size: expected ${size} bytes, got ${actualSize} bytes`,
		);
	}
}
