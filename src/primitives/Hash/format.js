/**
 * Format hash for display (truncated)
 *
 * @param {import('./BrandedHash.js').BrandedHash} hash - Hash to format
 * @param {number} [prefixLength=6] - Number of chars to show at start
 * @param {number} [suffixLength=4] - Number of chars to show at end
 * @returns {string} Formatted string like "0x1234...5678"
 *
 * @example
 * ```js
 * const hash = Hash('0x1234...');
 * const display = Hash.format(hash); // "0x1234...5678"
 * const display2 = hash.format(); // Same result
 * ```
 */
export function format(hash, prefixLength = 6, suffixLength = 4) {
	const hex = `0x${Array.from(hash, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
	if (hex.length <= prefixLength + suffixLength + 2) {
		return hex;
	}
	return `${hex.slice(0, prefixLength + 2)}...${hex.slice(-suffixLength)}`;
}
