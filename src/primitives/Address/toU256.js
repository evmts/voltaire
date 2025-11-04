import { SIZE } from "./constants.js";

/**
 * Convert Address to uint256
 *
 * @param {import('./BrandedAddress.js').BrandedAddress} address - Address to convert
 * @returns {bigint} Bigint representation
 *
 * @example
 * ```typescript
 * const value = Address.toU256(addr);
 * ```
 */
export function toU256(address) {
	let result = 0n;
	for (let i = 0; i < SIZE; i++) {
		result = (result << 8n) | BigInt(address[i] ?? 0);
	}
	return result;
}
