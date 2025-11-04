/**
 * Convert hash output to hex string
 *
 * @param {Uint8Array} hash - Hash bytes
 * @returns {string} Hex string with 0x prefix
 *
 * @example
 * ```typescript
 * const hash = SHA256.hash(data);
 * const hexStr = SHA256.toHex(hash);
 * // "0x..."
 * ```
 */
export function toHex(hash) {
	return `0x${Array.from(hash)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("")}`;
}
