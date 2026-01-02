import { fromBytes } from "./fromBytes.js";
import type { HexType } from "./HexType.js";

/**
 * Create zero-filled hex of specific size
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
 * ```
 */
export function zero(size: number): HexType {
	return fromBytes(new Uint8Array(size));
}
