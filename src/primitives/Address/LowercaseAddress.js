import { toHex } from "./toHex.js";

/**
 * @typedef {import('../Hex/index.js').Sized<20> & { readonly __tag: 'Hex'; readonly __variant: 'Address'; readonly __lowercase: true }} Lowercase
 */

/**
 * Create lowercase address hex string from Address
 *
 * @param {import('./BrandedAddress.js').BrandedAddress} addr - Address to format
 * @returns {Lowercase} Lowercase address hex string
 *
 * @example
 * ```typescript
 * const addr = Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
 * const lower = Lowercase.from(addr);
 * // "0x742d35cc6634c0532925a3b844bc9e7595f251e3"
 * ```
 */
export function from(addr) {
	return toHex(addr).toLowerCase();
}
