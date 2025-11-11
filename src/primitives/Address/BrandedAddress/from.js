import * as OxAddress from "ox/Address";
import { InvalidHexFormatError, InvalidValueError } from "./errors.js";
import { fromBytes } from "./fromBytes.js";
import { fromNumber } from "./fromNumber.js";

/**
 * Create Address from various input types (universal constructor)
 *
 * @param {number | bigint | string | Uint8Array} value - Number, bigint, hex string, or Uint8Array
 * @returns {import('./BrandedAddress.js').BrandedAddress} Address
 * @throws {InvalidValueError} If value type is unsupported or invalid
 * @throws {InvalidHexFormatError} If hex string is invalid
 * @throws {InvalidAddressLengthError} If bytes length is not 20
 *
 * @example
 * ```typescript
 * const addr1 = Address.from(0x742d35Cc6634C0532925a3b844Bc9e7595f251e3n);
 * const addr2 = Address.from(12345);
 * const _addr3 = Address.from("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
 * const addr4 = Address.from(new Uint8Array(20));
 * ```
 */
export function from(value) {
	if (typeof value === "number" || typeof value === "bigint") {
		return fromNumber(value);
	}
	if (typeof value === "string") {
		// Normalize to lowercase to avoid checksum validation errors
		// (ox validates checksum strictly by default; lowercase is always valid)
		const normalized = value.toLowerCase();
		try {
			// Use ox for hex string parsing (delegates to ox)
			const hexResult = OxAddress.from(normalized);
			// Convert back to bytes
			const bytes = new Uint8Array(20);
			for (let i = 0; i < 20; i++) {
				bytes[i] = Number.parseInt(hexResult.slice(2 + i * 2, 2 + i * 2 + 2), 16);
			}
			return /** @type {import('./BrandedAddress.js').BrandedAddress} */ (bytes);
		} catch (error) {
			// Convert ox errors to our custom errors
			throw new InvalidHexFormatError(
				error instanceof Error ? error.message : "Invalid address format",
			);
		}
	}
	if (value instanceof Uint8Array) {
		return fromBytes(value);
	}
	throw new InvalidValueError("Unsupported address value type", {
		value,
		expected: "number, bigint, string, or Uint8Array",
	});
}
