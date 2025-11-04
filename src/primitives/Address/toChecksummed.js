import * as Checksummed from "./ChecksumAddress.js";

/**
 * Convert Address to EIP-55 checksummed hex string
 *
 * @param {import('./BrandedAddress.js').BrandedAddress} address - Address to convert
 * @returns {import('./ChecksumAddress.js').Checksummed} Checksummed hex string with mixed case
 *
 * @example
 * ```typescript
 * const checksummed = Address.toChecksummed(addr);
 * // "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3"
 * ```
 */
export function toChecksummed(address) {
	return Checksummed.from(address);
}
