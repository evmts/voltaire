/**
 * Convert Address to Uint8Array
 *
 * @this {import('./BrandedAddress.js').BrandedAddress}
 * @returns {Uint8Array} Underlying Uint8Array
 *
 * @example
 * ```typescript
 * const addr = Address.from("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
 * const bytes = Address.toBytes(addr);
 * console.log(bytes); // Uint8Array(20) [...]
 * ```
 */
export function toBytes() {
	return new Uint8Array(this);
}
