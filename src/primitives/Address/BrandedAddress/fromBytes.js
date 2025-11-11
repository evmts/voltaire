import { SIZE } from "./constants.js";
import { InvalidAddressLengthError } from "./errors.js";

/**
 * Create Address from raw bytes (standard form)
 *
 * @param {Uint8Array} bytes - Raw 20-byte array
 * @returns {import('./BrandedAddress.js').BrandedAddress} Address
 * @throws {InvalidAddressLengthError} If length is not 20 bytes
 *
 * @example
 * ```typescript
 * const bytes = new Uint8Array(20);
 * const addr = Address.fromBytes(bytes);
 * ```
 */
export function fromBytes(bytes) {
	if (bytes.length !== SIZE) {
		throw new InvalidAddressLengthError("Invalid address length", {
			value: bytes,
			context: { actualLength: bytes.length },
		});
	}
	return /** @type {import('./BrandedAddress.js').BrandedAddress} */ (
		new Uint8Array(bytes)
	);
}
