import { SIZE } from "./constants.js";
import { InvalidValueError } from "./errors.js";

/**
 * Create Address from number value (takes lower 160 bits) (standard form)
 *
 * @param {bigint | number} value - Number or bigint value
 * @returns {import('./BrandedAddress.js').BrandedAddress} Address from lower 160 bits
 * @throws {InvalidValueError} If value is negative
 *
 * @example
 * ```typescript
 * const addr = Address.fromNumber(0x742d35Cc6634C0532925a3b844Bc9e7595f251e3n);
 * const addr2 = Address.fromNumber(12345);
 * ```
 */
export function fromNumber(value) {
	const bigintValue = typeof value === "number" ? BigInt(value) : value;

	if (bigintValue < 0n) {
		throw new InvalidValueError("Address value cannot be negative");
	}

	const bytes = new Uint8Array(SIZE);
	let v = bigintValue & ((1n << 160n) - 1n);
	for (let i = 19; i >= 0; i--) {
		bytes[i] = Number(v & 0xffn);
		v >>= 8n;
	}
	return bytes;
}
