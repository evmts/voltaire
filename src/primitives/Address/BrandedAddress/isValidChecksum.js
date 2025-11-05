import { isValid as checksummedIsValid } from "./ChecksumAddress.js";

/**
 * Check if string has valid EIP-55 checksum (standard form)
 *
 * @param {string} str - Address string to validate
 * @returns {boolean} True if checksum is valid
 *
 * @example
 * ```typescript
 * if (Address.isValidChecksum("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3")) {
 *   console.log("Valid checksum");
 * }
 * ```
 */
export function isValidChecksum(str) {
	return checksummedIsValid(str);
}
