import type { Unsized } from "./Hex.js";
import { fromBytes } from "./fromBytes.js";

/**
 * Create zero-filled hex of specific size
 *
 * @param size - Size in bytes
 * @returns Zero-filled hex string
 *
 * @example
 * ```typescript
 * Hex.zero(4); // '0x00000000'
 * ```
 */
export function zero(size: number): Unsized {
	return fromBytes(new Uint8Array(size));
}
