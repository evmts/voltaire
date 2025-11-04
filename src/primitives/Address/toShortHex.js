import { toHex } from "./toHex.js";

/**
 * Format address with shortened display
 *
 * @param {import('./BrandedAddress.js').BrandedAddress} address - Address to format
 * @param {number} [prefixLength=6] - Number of chars to show at start
 * @param {number} [suffixLength=4] - Number of chars to show at end
 * @returns {string} Shortened address like "0x742d...51e3"
 *
 * @example
 * ```typescript
 * const short = Address.toShortHex(addr);
 * // "0x742d...51e3"
 * const custom = Address.toShortHex(addr, 8, 6);
 * // "0x742d35...251e3"
 * ```
 */
export function toShortHex(address, prefixLength, suffixLength) {
	const prefix = prefixLength ?? 6;
	const suffix = suffixLength ?? 4;

	const hex = toHex(address);
	if (prefix + suffix >= 40) return hex;
	return `${hex.slice(0, 2 + prefix)}...${hex.slice(-suffix)}`;
}
