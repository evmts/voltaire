import { decodeHexDigitsInto } from "../Hex/decodeHexDigitsInto.js";
import { HEX_SIZE, SIZE } from "./constants.js";
import { InvalidHexFormatError, InvalidHexStringError } from "./errors.js";

/**
 * Parse hex string to Address (standard form)
 *
 * @param {string} hex - Hex string with 0x prefix
 * @returns {import('./AddressType.js').AddressType} Address bytes
 * @throws {InvalidHexFormatError} If invalid format or length
 * @throws {InvalidHexStringError} If hex contains invalid characters
 *
 * @example
 * ```typescript
 * const addr = Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
 * ```
 */
export function fromHex(hex) {
	if (
		typeof hex !== "string" ||
		!hex.startsWith("0x") ||
		hex.length !== HEX_SIZE
	) {
		throw new InvalidHexFormatError("Invalid hex format for address", {
			value: hex,
		});
	}
	const bytes = new Uint8Array(SIZE);
	if (decodeHexDigitsInto(hex, 2, bytes) !== -1) {
		throw new InvalidHexStringError("Invalid hex string", {
			value: hex,
		});
	}
	return /** @type {import('./AddressType.js').AddressType} */ (bytes);
}
