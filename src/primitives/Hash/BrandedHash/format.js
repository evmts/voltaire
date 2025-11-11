/**
 * Format hash for display (truncated)
 *
 * @see https://voltaire.tevm.sh/primitives/hash for Hash documentation
 * @since 0.0.0
 * @param {import('./BrandedHash.js').BrandedHash} hash - Hash to format
 * @param {number} [prefixLength=6] - Number of chars to show at start
 * @param {number} [suffixLength=4] - Number of chars to show at end
 * @returns {string} Formatted string like "0x1234...5678"
 * @throws {never}
 * @example
 * ```javascript
 * import * as Hash from './primitives/Hash/index.js';
 * const hash = Hash.from('0x1234...');
 * const display = Hash.format(hash); // "0x1234...5678"
 * ```
 */
export function format(hash, prefixLength = 6, suffixLength = 4) {
	const hex = `0x${Array.from(hash, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
	if (hex.length <= prefixLength + suffixLength + 2) {
		return hex;
	}
	return `${hex.slice(0, prefixLength + 2)}...${hex.slice(-suffixLength)}`;
}
