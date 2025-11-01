import type { Unsized } from "./Hex.js";
import { fromBytes } from "./fromBytes.js";

/**
 * Convert string to hex
 *
 * @param str - String to convert
 * @returns Hex string
 *
 * @example
 * ```typescript
 * Hex.fromString('hello'); // '0x68656c6c6f'
 * ```
 */
export function fromString(str: string): Unsized {
	const encoder = new TextEncoder();
	return fromBytes(encoder.encode(str));
}
