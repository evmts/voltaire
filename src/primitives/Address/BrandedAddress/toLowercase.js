import { from as lowercaseFrom } from "./LowercaseAddress.js";

/**
 * Convert Address to lowercase hex string
 *
 * @param {import('./BrandedAddress.js').BrandedAddress} address - Address to convert
 * @returns {import('./LowercaseAddress.js').Lowercase} Lowercase hex string
 *
 * @example
 * ```typescript
 * const lower = Address.toLowercase(addr);
 * // "0x742d35cc6634c0532925a3b844bc9e7595f251e3"
 * ```
 */
export function toLowercase(address) {
	return lowercaseFrom(address);
}
