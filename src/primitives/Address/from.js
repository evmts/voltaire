import { InvalidValueError } from "./errors.js";
import { fromBytes } from "./fromBytes.js";
import { fromHex } from "./fromHex.js";
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
		return fromHex(value);
	}
	if (value instanceof Uint8Array) {
		return fromBytes(value);
	}
	throw new InvalidValueError("Unsupported address value type");
}
