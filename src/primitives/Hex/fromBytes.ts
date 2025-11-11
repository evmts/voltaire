import type { BrandedHex } from "./BrandedHex.js";

/**
 * Convert bytes to hex
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param bytes - Byte array to convert
 * @returns Hex string
 * @throws {never}
 * @example
 * ```typescript
 * import * as Hex from './primitives/Hex/index.js';
 * const hex = Hex.fromBytes(new Uint8Array([0x12, 0x34])); // '0x1234'
 * ```
 */
export function fromBytes(bytes: Uint8Array): BrandedHex {
	const hexChars = "0123456789abcdef";
	let result = "0x";
	for (let i = 0; i < bytes.length; i++) {
		const b = bytes[i]!;
		result += hexChars[b >> 4]! + hexChars[b & 0x0f]!;
	}
	return result as BrandedHex;
}
