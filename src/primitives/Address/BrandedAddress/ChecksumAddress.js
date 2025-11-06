import { keccak256 } from "../../Hash/BrandedHash/keccak256.js";
import { from as fromAddress } from "./from.js";
import { fromHex } from "./fromHex.js";
import { isValid as isValidAddress } from "./isValid.js";
import { toHex } from "./toHex.js";

/**
 * @typedef {import('../../Hex/index.js').Sized<20> & { readonly __tag: 'Hex'; readonly __variant: 'Address'; readonly __checksummed: true }} Checksummed
 */

/**
 * Create checksummed address from Address
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
	const lower = toHex(addr).slice(2);
	const hashBytes = keccak256(new TextEncoder().encode(lower));
	const hashHex = Array.from(hashBytes, (b) =>
		b.toString(16).padStart(2, "0"),
	).join("");
	let result = "0x";
	for (let i = 0; i < 40; i++) {
		const ch = lower[i];
		if (ch !== undefined && ch >= "a" && ch <= "f") {
			const hv = Number.parseInt(hashHex[i] ?? "0", 16);
			result += hv >= 8 ? ch.toUpperCase() : ch;
		} else {
			result += ch ?? "";
		}
	}
	return /** @type {Checksummed} */ (result);
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
