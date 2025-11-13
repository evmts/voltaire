import { InvalidBytesFormatError } from "./errors.js";

/**
 * Create Bytes from hex string
 *
 * @param {string} hex - Hex string with 0x prefix
 * @returns {import('./BrandedBytes.js').BrandedBytes} Bytes
 * @throws {InvalidBytesFormatError} If hex string is invalid
 *
 * @example
 * ```typescript
 * const bytes = Bytes.fromHex("0x1234");
 * // Uint8Array([0x12, 0x34])
 * ```
 */
export function fromHex(hex) {
	if (!hex.startsWith("0x")) {
		throw new InvalidBytesFormatError("Hex string must start with 0x", { hex });
	}
	const hexNoPrefix = hex.slice(2);
	if (hexNoPrefix.length % 2 !== 0) {
		throw new InvalidBytesFormatError("Hex string must have even length", {
			hex,
		});
	}
	const bytes = new Uint8Array(hexNoPrefix.length / 2);
	for (let i = 0; i < bytes.length; i++) {
		const byte = Number.parseInt(hexNoPrefix.slice(i * 2, i * 2 + 2), 16);
		if (Number.isNaN(byte)) {
			throw new InvalidBytesFormatError("Invalid hex character", { hex });
		}
		bytes[i] = byte;
	}
	return /** @type {import('./BrandedBytes.js').BrandedBytes} */ (bytes);
}
