import type { Unsized } from "./Hex.js";
import { fromBytes } from "./fromBytes.js";

/**
 * Generate random hex of specific size
 *
 * @param size - Size in bytes
 * @returns Random hex string
 *
 * @example
 * ```typescript
 * const random = Hex.random(32); // random 32-byte hex
 * ```
 */
export function random(size: number): Unsized {
	const bytes = new Uint8Array(size);
	crypto.getRandomValues(bytes);
	return fromBytes(bytes);
}
