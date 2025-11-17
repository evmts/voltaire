import { equals } from "./equals.js";

/**
 * Remove duplicate addresses from array
 * Preserves first occurrence of each unique address
 *
 * @param {import('./BrandedAddress.ts').BrandedAddress[]} addresses - Addresses to deduplicate
 * @returns {import('./BrandedAddress.ts').BrandedAddress[]} Deduplicated addresses (new array)
 *
 * @example
 * ```typescript
 * const unique = Address.deduplicateAddresses([addr1, addr2, addr1, addr3]);
 * // Returns [addr1, addr2, addr3]
 * ```
 */
export function deduplicateAddresses(addresses) {
	const result = [];
	const seen = [];

	for (const address of addresses) {
		let found = false;
		for (const seenAddr of seen) {
			if (equals(address, seenAddr)) {
				found = true;
				break;
			}
		}
		if (!found) {
			result.push(address);
			seen.push(address);
		}
	}

	return result;
}
