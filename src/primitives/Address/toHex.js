/**
 * Convert Address to hex string
 *
 * @param {import('./BrandedAddress.js').BrandedAddress} address - Address to convert
 * @returns {import('../Hex/index.js').BrandedHex} Lowercase hex string with 0x prefix
 *
 * @example
 * ```typescript
 * const hex = Address.toHex(addr);
 * // "0x742d35cc6634c0532925a3b844bc9e7595f251e3"
 * ```
 */
export function toHex(address) {
	return /** @type {import('../Hex/index.js').BrandedHex} */ (
		`0x${Array.from(address, (b) => b.toString(16).padStart(2, "0")).join("")}`
	);
}
