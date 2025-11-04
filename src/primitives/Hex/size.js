/**
 * Get byte size of hex
 *
 * @param {string} hex - Hex string
 * @returns {number} Size in bytes
 *
 * @example
 * ```typescript
 * const hex = Hex('0x1234');
 * const s1 = Hex.size(hex); // 2
 * const s2 = hex.size(); // 2
 * ```
 */
export function size(hex) {
	return (hex.length - 2) / 2;
}
