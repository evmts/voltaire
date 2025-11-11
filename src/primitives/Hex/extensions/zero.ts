import type { Hex } from "ox";

/**
 * Generate a zero-filled hex value of specified size
 * Voltaire extension - not available in Ox
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param size - Size in bytes
 * @returns Zero-filled hex string
 * @throws {never}
 * @example
 * ```typescript
 * import * as Hex from './primitives/Hex/index.js';
 * Hex.zero(4); // '0x00000000'
 * Hex.zero(32); // '0x0000000000000000000000000000000000000000000000000000000000000000'
 * ```
 */
export function zero(size: number): Hex.Hex {
	return `0x${"00".repeat(size)}` as Hex.Hex;
}
