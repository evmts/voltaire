/**
 * Check if address is zero address
 *
 * @param {import('./BrandedAddress.js').BrandedAddress} address - Address to check
 * @returns {boolean} True if all bytes are zero
 *
 * @example
 * ```typescript
 * if (Address.isZero(addr)) {
 *   console.log("Zero address");
 * }
 * ```
 */
export function isZero(address) {
	return address.every((b) => b === 0);
}
