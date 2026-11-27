import { InvalidFormatError } from "./errors.js";
import type { HexType } from "./HexType.js";

/**
 * Convert bytes to hex
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param bytes - Byte array to convert
 * @returns Hex string
 * @throws {InvalidFormatError} If input is not a Uint8Array
 * @example
 * ```typescript
 * import * as Hex from './primitives/Hex/index.js';
 * const hex = Hex.fromBytes(new Uint8Array([0x12, 0x34])); // '0x1234'
 * ```
 */
export function fromBytes(bytes: Uint8Array): HexType {
	if (!(bytes instanceof Uint8Array)) {
		throw new InvalidFormatError("Expected Uint8Array for Hex.fromBytes", {
			value: bytes,
			expected: "Uint8Array",
		});
	}
	const hexChars = "0123456789abcdef";
	let result = "0x";
	for (let i = 0; i < bytes.length; i++) {
		// biome-ignore lint/style/noNonNullAssertion: bounds checked by loop
		const b = bytes[i]!;
		// biome-ignore lint/style/noNonNullAssertion: hex lookup always valid for 0-15
		result += hexChars[b >> 4]! + hexChars[b & 0x0f]!;
	}
	return result as HexType;
}
