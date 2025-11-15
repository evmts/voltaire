import type { HexType } from "./HexType.js";
import { fromBytes } from "./fromBytes.js";

/**
 * Create Hex from string or bytes
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param value - Hex string or bytes
 * @returns Hex string
 * @throws {never}
 * @example
 * ```typescript
 * import * as Hex from './primitives/Hex/index.js';
 * const hex = Hex.from('0x1234');
 * const hex2 = Hex.from(new Uint8Array([0x12, 0x34]));
 * ```
 */
export function from(value: string | Uint8Array): HexType {
	if (typeof value === "string") {
		return value as HexType;
	}
	return fromBytes(value);
}
