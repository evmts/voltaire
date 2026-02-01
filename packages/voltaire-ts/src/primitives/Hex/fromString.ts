import { fromBytes } from "./fromBytes.js";
import type { HexType } from "./HexType.js";

/**
 * Convert string to hex
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param str - String to convert
 * @returns Hex string
 * @throws {never}
 * @example
 * ```typescript
 * import * as Hex from './primitives/Hex/index.js';
 * Hex.fromString('hello'); // '0x68656c6c6f'
 * ```
 */
export function fromString(str: string): HexType {
	const encoder = new TextEncoder();
	return fromBytes(encoder.encode(str));
}
