/**
 * Convert Hash to hex string
 *
 * @param {import('./BrandedHash.ts').BrandedHash} hash - Hash to convert
 * @returns {string} Hex string with 0x prefix
 *
 * @example
 * ```js
 * const hash = Hash.from('0x1234...');
 * const hex = Hash.toHex(hash); // "0x1234..."
 * ```
 */
export function toHex(hash) {
	return `0x${Array.from(hash, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}
