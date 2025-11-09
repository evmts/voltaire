import { toHex } from "./toHex.js";

/**
 * Format hash for display (truncated with ellipsis)
 *
 * @param {import('./BrandedHash.ts').BrandedHash} hash - Hash to format
 * @returns {string} Formatted hash string like "0x1234...cdef"
 *
 * @example
 * ```js
 * const hash = Hash.from('0x1234567890abcdef...');
 * const formatted = Hash.format(hash); // "0x1234...cdef"
 * ```
 */
export function format(hash) {
	const hex = toHex(hash);
	if (hex.length <= 10) {
		return hex;
	}
	return `${hex.slice(0, 6)}...${hex.slice(-4)}`;
}
