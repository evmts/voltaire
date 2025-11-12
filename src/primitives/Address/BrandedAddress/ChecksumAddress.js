import { hash as keccak256 } from "../../../crypto/Keccak256/hash.js";
import { from as fromAddress } from "./from.js";
import { fromHex } from "./fromHex.js";
import { isValid as isValidAddress } from "./isValid.js";
import { toHex } from "./toHex.js";

/**
 * @typedef {import('../../Hex/index.js').Sized<20> & { readonly [import('../../../brand.js').brand]: 'Hex'; readonly __variant: 'Address'; readonly __checksummed: true }} Checksummed
 */

/**
 * Create checksummed address from Address (EIP-55)
 *
 * @param {number | bigint | string | Uint8Array} value - Number, bigint, hex string, or Uint8Array
 * @returns {Checksummed} Checksummed address hex string
 *
 * @example
 * ```typescript
 * const checksummed = ChecksumAddress.from("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
 * // "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3"
 * ```
 */
export function from(value) {
	const addr = fromAddress(value);
	const hex = toHex(addr);

	// Remove 0x prefix for hashing
	const addrLower = hex.slice(2).toLowerCase();

	// Hash the lowercase address
	const hash = keccak256(new TextEncoder().encode(addrLower));

	// Apply checksum: uppercase if hash nibble >= 8
	let checksummed = "0x";
	for (let i = 0; i < addrLower.length; i++) {
		const char = addrLower[i];
		if (char === undefined) break;

		const hashByte = hash[Math.floor(i / 2)];
		if (hashByte === undefined) break;

		const hashNibble = i % 2 === 0 ? hashByte >> 4 : hashByte & 0x0f;

		checksummed += hashNibble >= 8 ? char.toUpperCase() : char;
	}

	return /** @type {Checksummed} */ (checksummed);
}

/**
 * Check if string has valid EIP-55 checksum
 *
 * @param {string} str - Address string to validate
 * @returns {boolean} True if checksum is valid
 *
 * @example
 * ```typescript
 * if (ChecksumAddress.isValid("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3")) {
 *   console.log("Valid checksum");
 * }
 * ```
 */
export function isValid(str) {
	if (typeof str !== "string") return false;
	if (!isValidAddress(str)) return false;
	try {
		const addr = fromHex(str.startsWith("0x") ? str : `0x${str}`);
		const checksummed = from(addr);
		return checksummed === (str.startsWith("0x") ? str : `0x${str}`);
	} catch {
		return false;
	}
}
