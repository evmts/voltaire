import type { Hex } from "ox";
import * as OxHex from "ox/Hex";

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
export function xor(a: Hex.Hex, b: Hex.Hex): Hex.Hex {
	const bytesA = OxHex.toBytes(a);
	const bytesB = OxHex.toBytes(b);
	const maxLen = Math.max(bytesA.length, bytesB.length);
	const result = new Uint8Array(maxLen);

	for (let i = 0; i < maxLen; i++) {
		result[i] = (bytesA[i] || 0) ^ (bytesB[i] || 0);
	}

	return OxHex.fromBytes(result);
}
