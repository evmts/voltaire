import * as OxAddress from "ox/Address";
import { toHex } from "./toHex.js";

/**
 * Check if two addresses are equal
 *
 * @param {import('./BrandedAddress.js').BrandedAddress} address - First address
 * @param {import('./BrandedAddress.js').BrandedAddress} other - Address to compare with
 * @returns {boolean} True if addresses are identical
 *
 * @example
 * ```typescript
 * if (Address.equals(addr1, addr2)) {
 *   console.log("Addresses match");
 * }
 * ```
 */
export function equals(address, other) {
	return OxAddress.isEqual(toHex(address), toHex(other));
}
