import type { Hex } from "ox";

/**
 * Generate a zero-filled hex value of specified size
 * Voltaire extension - not available in Ox
 *
 * @param size - Size in bytes
 * @returns Zero-filled hex string
 *
 * @example
 * zero(4) // '0x00000000'
 * zero(32) // '0x0000000000000000000000000000000000000000000000000000000000000000'
 */
export function zero(size: number): Hex.Hex {
	return `0x${"00".repeat(size)}` as Hex.Hex;
}
