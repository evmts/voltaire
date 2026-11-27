import { decodeHexDigitsInto } from "../Hex/decodeHexDigitsInto.js";
import { InvalidBytesFormatError } from "./errors.js";

/**
 * Create Bytes from hex string
 *
 * @param {string} hex - Hex string with 0x prefix
 * @returns {import('./BytesType.js').BytesType} Bytes
 * @throws {InvalidBytesFormatError} If hex string is invalid
 *
 * @example
 * ```typescript
 * const bytes = Bytes.fromHex("0x1234");
 * // Uint8Array([0x12, 0x34])
 * ```
 */
export function fromHex(hex) {
	if (typeof hex !== "string" || !hex.startsWith("0x")) {
		throw new InvalidBytesFormatError("Hex string must start with 0x", {
			value: hex,
			expected: "0x-prefixed hex string",
		});
	}
	const hexNoPrefixLength = hex.length - 2;
	if (hexNoPrefixLength % 2 !== 0) {
		throw new InvalidBytesFormatError("Hex string must have even length", {
			value: hex,
			expected: "even-length hex string",
		});
	}
	const bytes = new Uint8Array(hexNoPrefixLength / 2);
	if (decodeHexDigitsInto(hex, 2, bytes) !== -1) {
		throw new InvalidBytesFormatError("Invalid hex character", {
			value: hex,
			expected: "valid hex characters (0-9, a-f, A-F)",
		});
	}
	return /** @type {import('./BytesType.js').BytesType} */ (bytes);
}
