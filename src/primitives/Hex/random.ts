import type { BrandedHex } from "./BrandedHex.js";
import { fromBytes } from "./fromBytes.js";

/**
 * Generate random hex of specific size
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param size - Size in bytes
 * @returns Random hex string
 * @throws {never}
 * @example
 * ```typescript
 * import * as Hex from './primitives/Hex/index.js';
 * const random = Hex.random(32); // random 32-byte hex
 * ```
 */
export function random(size: number): BrandedHex {
	const bytes = new Uint8Array(size);
	crypto.getRandomValues(bytes);
	return fromBytes(bytes);
}
