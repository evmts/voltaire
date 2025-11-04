import type { BrandedHex } from "./BrandedHex.js";
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
export function zero(size: number): BrandedHex {
	return fromBytes(new Uint8Array(size));
}
