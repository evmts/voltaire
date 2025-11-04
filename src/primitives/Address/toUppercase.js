import { from as uppercaseFrom } from "./UppercaseAddress.js";

/**
 * Convert Address to uppercase hex string
 *
 * @param {import('./BrandedAddress.js').BrandedAddress} address - Address to convert
 * @returns {import('./UppercaseAddress.js').Uppercase} Uppercase hex string
 *
 * @example
 * ```typescript
 * const upper = Address.toUppercase(addr);
 * // "0x742D35CC6634C0532925A3B844BC9E7595F251E3"
 * ```
 */
export function toUppercase(address) {
	return uppercaseFrom(address);
}
