import { toChecksummed } from "./toChecksummed.js";

/**
 * Format address for display (checksummed)
 *
 * @param {import('./BrandedAddress.js').BrandedAddress} address - Address to format
 * @returns {string} Checksummed hex string
 *
 * @example
 * ```typescript
 * console.log(Address.format(addr));
 * // "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3"
 * ```
 */
export function format(address) {
	return toChecksummed(address);
}
