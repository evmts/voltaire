import type { HexType } from "../HexType.js";
import { toBytes } from "../toBytes.js";
import { fromBytes } from "../fromBytes.js";

/**
 * XOR two hex values (bitwise exclusive OR)
 * Voltaire extension - not available in Ox
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param a - First hex value
 * @param b - Second hex value
 * @returns XOR result
 * @throws {never}
 * @example
 * ```typescript
 * import * as Hex from './primitives/Hex/index.js';
 * Hex.xor('0xff', '0x0f'); // '0xf0'
 * ```
 */
export function xor(a: HexType, b: HexType): HexType {
	const bytesA = toBytes(a);
	const bytesB = toBytes(b);
	const maxLen = Math.max(bytesA.length, bytesB.length);
	const result = new Uint8Array(maxLen);

	for (let i = 0; i < maxLen; i++) {
		result[i] = (bytesA[i] || 0) ^ (bytesB[i] || 0);
	}

	return fromBytes(result);
}
