import { toHex } from "./toHex.js";

/**
 * @typedef {import('../../Hex/index.js').Sized<20> & { readonly __variant: 'Address'; readonly __uppercase: true }} Uppercase
 */

/**
 * Create uppercase address hex string from Address
 *
 * @param {import('./BrandedAddress.js').BrandedAddress} addr - Address to format
 * @returns {Uppercase} Uppercase address hex string
 *
 * @example
 * ```typescript
 * const addr = Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
 * const upper = Uppercase.from(addr);
 * // "0x742D35CC6634C0532925A3B844BC9E7595F251E3"
 * ```
 */
export function from(addr) {
	const hex = toHex(addr);
	return /** @type {Uppercase} */ (`0x${hex.slice(2).toUpperCase()}`);
}
