import { from } from "./from.js";

/**
 * Create a deep copy of an Address
 *
 * @param {import('./BrandedAddress.js').BrandedAddress} address - Address to clone
 * @returns {import('./BrandedAddress.js').BrandedAddress} Deep copy
 *
 * @example
 * ```typescript
 * const addr1 = Address.from("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
 * const addr2 = Address.clone(addr1);
 * console.log(Address.equals(addr1, addr2)); // true
 * console.log(addr1 === addr2); // false
 * ```
 */
export function clone(address) {
	return from(new Uint8Array(address));
}
